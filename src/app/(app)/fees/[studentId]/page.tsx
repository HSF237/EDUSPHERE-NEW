import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { Badge, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { PAY_MODES, studentLedger } from "@/lib/fees-data";
import { fmtDate, inr, isoDate, todayUTC } from "@/lib/utils";
import { sendFeeReminder } from "../actions";
import { PaymentForm } from "../forms";

export const metadata = { title: "Student fees" };

export default async function StudentFees({ params }: { params: Promise<{ studentId: string }> }) {
  const ctx = await getCtx();
  if (!can(ctx, "FEES")) redirect("/dashboard");
  const { studentId } = await params;
  const st = await db.student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId }, include: { class: true } });
  if (!st) notFound();
  const today = todayUTC();
  const l = await studentLedger(ctx.schoolId, st, today);
  return (
    <>
      <PageHeader title={st.name} sub={`Class ${st.class.name} · Roll ${st.rollNo} · Admission ${st.admissionNo}`}>
        <Link href="/fees" className="btn-ghost">← All fees</Link>
        {l.due > 0 && <form action={sendFeeReminder.bind(null, st.id)}><button className="btn-ghost">Prepare parent reminder</button></form>}
      </PageHeader>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total fees" value={inr(l.charged)} />
        <Stat label="Balance due" value={inr(l.due)} tone={l.due ? "amber" : "green"} hint={l.overdue ? `${inr(l.overdue)} overdue` : undefined} />
        <Stat label="Advance / credit" value={inr(l.credit)} tone="indigo" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Record a payment"><PaymentForm studentId={st.id} modes={PAY_MODES} today={isoDate(today)} items={l.rows.filter((r) => r.balance > 0).map((r) => ({ id: r.item.id, label: `${r.item.name} — ${inr(r.balance)} left` }))} /></Card>
        <Card title="Fees" flush>
          {l.rows.length === 0 ? <Empty title="No fees apply to this class" /> : (
            <Table head={["Fee", "Due", "Balance"]}>{l.rows.map((r) => <tr key={r.item.id}><td className="td font-medium">{r.item.name}<div className="text-xs text-slate-500">{inr(r.item.amount)}</div></td><td className="td">{fmtDate(r.item.dueOn)}</td><td className="td">{r.balance > 0 ? <Badge tone={r.overdue ? "red" : "amber"}>{inr(r.balance)}</Badge> : <Badge tone="green">Paid</Badge>}</td></tr>)}</Table>
          )}
        </Card>
      </div>
      <Card title="Payments & receipts" className="mt-6" flush>
        {l.payments.length === 0 ? <Empty title="No payments yet" /> : (
          <Table head={["Date", "Receipt", "Mode", "Amount", ""]}>{l.payments.map((p) => <tr key={p.id}><td className="td">{fmtDate(p.paidOn)}</td><td className="td">{p.receiptNo}</td><td className="td">{p.mode}</td><td className="td font-medium">{inr(p.amount)}</td><td className="td text-right"><Link className="text-xs font-semibold text-brand-600 hover:underline" href={`/fees/receipt/${p.id}`}>View / print</Link></td></tr>)}</Table>
        )}
      </Card>
    </>
  );
}
