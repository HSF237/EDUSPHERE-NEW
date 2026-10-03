import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { Badge, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { PAY_MODES, schoolLedgers, studentLedger } from "@/lib/fees-data";
import { fmtDate, inr, isoDate, todayUTC } from "@/lib/utils";
import { deleteFeeItem, sendFeeReminder } from "./actions";
import { FeeItemForm, RemindAll } from "./forms";

export const metadata = { title: "Fees" };

export default async function Fees({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await getCtx();
  const today = todayUTC();
  if (ctx.role === "PARENT") return <ParentFees ctx={ctx} today={today} />;
  if (!can(ctx, "FEES")) redirect("/dashboard");
  const { q = "" } = await searchParams;
  const [classes, items, ledgers, recent, usedItems] = await Promise.all([
    db.class.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" } }),
    db.feeItem.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { dueOn: "asc" } }),
    schoolLedgers(ctx.schoolId, today),
    db.feePayment.aggregate({ where: { schoolId: ctx.schoolId, paidOn: { gte: new Date(today.getTime() - 30 * 864e5) }, NOT: { mode: { startsWith: "Waiver" } } }, _sum: { amount: true } }),
    db.feePayment.groupBy({ by: ["itemId"], where: { schoolId: ctx.schoolId, itemId: { not: null } } }),
  ]);
  const cname = new Map(classes.map((c) => [c.id, c.name]));
  const used = new Set(usedItems.map((u) => u.itemId));
  const outstanding = ledgers.reduce((a, l) => a + l.due, 0);
  const overdue = ledgers.reduce((a, l) => a + l.overdue, 0);
  const late = ledgers.filter((l) => l.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 100);
  const needle = q.trim().toLowerCase();
  const found = needle ? ledgers.filter((l) => l.s.name.toLowerCase().includes(needle) || String(l.s.rollNo).includes(needle)).slice(0, 20) : [];
  return (
    <>
      <PageHeader title="Fees" sub="Fee structure, dues, receipts and reminders." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={inr(outstanding)} tone="amber" />
        <Stat label="Overdue" value={inr(overdue)} tone="red" hint={`${late.length} student${late.length === 1 ? "" : "s"}`} />
        <Stat label="Collected (30 days)" value={inr(recent._sum.amount ?? 0)} tone="green" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Find a student to take a payment">
          <form className="flex gap-2"><input name="q" defaultValue={q} className="input" placeholder="Student name or roll number" aria-label="Search students" /><button className="btn">Search</button></form>
          {needle && (found.length === 0 ? <p className="mt-3 text-sm text-slate-500">No student found.</p> : (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">{found.map((l) => (
              <li key={l.s.id} className="flex items-center justify-between gap-3 py-2"><span>{l.s.name} <span className="text-slate-500">· Class {l.s.class.name} · Roll {l.s.rollNo}</span></span><span className="flex items-center gap-3"><b>{inr(l.due)}</b><Link className="btn !px-3 !py-1.5 text-xs" href={`/fees/${l.s.id}`}>Open</Link></span></li>))}</ul>))}
        </Card>
        <Card title="Add a fee"><FeeItemForm classes={classes.map((c) => ({ id: c.id, name: c.name }))} /></Card>
      </div>
      <Card title="Fee structure" className="mt-6" flush>
        {items.length === 0 ? <Empty title="No fees yet" hint="Add your first fee above — for example “Term 1 tuition”, ₹12,000, due 10 June." /> : (
          <Table head={["Fee", "Class", "Amount", "Due", ""]}>{items.map((i) => (
            <tr key={i.id}><td className="td font-medium">{i.name}</td><td className="td">{i.classId ? `Class ${cname.get(i.classId) ?? ""}` : "All classes"}</td><td className="td">{inr(i.amount)}</td><td className="td">{fmtDate(i.dueOn)}</td>
              <td className="td text-right">{used.has(i.id) ? <span className="text-xs text-slate-400">has payments</span> : <form action={deleteFeeItem.bind(null, i.id)}><button className="text-xs font-semibold text-red-600 hover:underline">Delete</button></form>}</td></tr>))}</Table>
        )}
      </Card>
      <Card title="Overdue fees" className="mt-6" flush action={late.length ? <RemindAll /> : undefined}>
        {late.length === 0 ? <Empty title="Nobody is overdue" hint="Students with unpaid fees past their due date will appear here." /> : (
          <Table head={["Student", "Class", "Overdue", "Total due", ""]}>{late.map((l) => (
            <tr key={l.s.id}><td className="td font-medium">{l.s.name}</td><td className="td">{l.s.class.name}</td><td className="td"><Badge tone="red">{inr(l.overdue)}</Badge></td><td className="td">{inr(l.due)}</td>
              <td className="td"><div className="flex items-center justify-end gap-3"><form action={sendFeeReminder.bind(null, l.s.id)}><button className="text-xs font-semibold text-brand-600 hover:underline">Prepare reminder</button></form><Link className="btn !px-3 !py-1.5 text-xs" href={`/fees/${l.s.id}`}>Open</Link></div></td></tr>))}</Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-slate-500">Reminders are prepared on the Parent alerts page, ready to send on WhatsApp. Payment modes: {PAY_MODES.join(", ")}. Today is {isoDate(today)}.</p>
    </>
  );
}

async function ParentFees({ ctx, today }: { ctx: Awaited<ReturnType<typeof getCtx>>; today: Date }) {
  const kids = await db.student.findMany({ where: { id: { in: ctx.childIds }, schoolId: ctx.schoolId }, include: { class: true }, orderBy: { name: "asc" } });
  const data = await Promise.all(kids.map(async (k) => ({ k, l: await studentLedger(ctx.schoolId, k, today) })));
  return (
    <>
      <PageHeader title="Fees" sub="What is due for your child, and the receipts for what you have paid." />
      {data.length === 0 && <Card><Empty title="No children linked" /></Card>}
      {data.map(({ k, l }) => (
        <Card key={k.id} title={`${k.name} · Class ${k.class.name}`} className="mb-6" action={<Badge tone={l.due === 0 ? "green" : l.overdue > 0 ? "red" : "amber"}>{l.due === 0 ? "All paid" : `${inr(l.due)} due`}</Badge>} flush>
          {l.rows.length === 0 ? <Empty title="No fees set up yet" /> : (
            <Table head={["Fee", "Due date", "Amount", "Paid", "Balance"]}>{l.rows.map((r) => (
              <tr key={r.item.id}><td className="td font-medium">{r.item.name}</td><td className="td">{fmtDate(r.item.dueOn)}</td><td className="td">{inr(r.item.amount)}</td><td className="td">{inr(r.paid)}</td><td className="td">{r.balance > 0 ? <Badge tone={r.overdue ? "red" : "amber"}>{inr(r.balance)}</Badge> : <Badge tone="green">Paid</Badge>}</td></tr>))}</Table>
          )}
          {l.payments.length > 0 && (
            <div className="border-t border-slate-100 p-5"><h3 className="mb-2 text-sm font-semibold">Payments</h3>
              <ul className="divide-y divide-slate-100 text-sm">{l.payments.map((p) => <li key={p.id} className="flex items-center justify-between py-2"><span>{fmtDate(p.paidOn)} · {p.mode} · <b>{inr(p.amount)}</b></span><Link className="text-xs font-semibold text-brand-600 hover:underline" href={`/fees/receipt/${p.id}`}>Receipt {p.receiptNo}</Link></li>)}</ul></div>
          )}
        </Card>
      ))}
    </>
  );
}
