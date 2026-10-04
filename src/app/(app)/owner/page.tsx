import { db } from "@/lib/db";
import { Card, PageHeader, Table, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { accessOf } from "@/lib/billing";
import { isUnlocked, ownerConfigured, requireOwnerUser } from "@/lib/owner";
import { PasswordInput } from "@/components/password-input";
import { createFreeSchool, enterSupport, lockAction, setComp, unlockAction } from "./actions";

export const metadata = { title: "Owner tools" };

const tone = { COMPED: "indigo", ACTIVE: "green", GRACE: "amber", LOCKED: "red", SETUP: "amber" } as const;
const lbl = { COMPED: "Free", ACTIVE: "Paid", GRACE: "Grace", LOCKED: "Read-only", SETUP: "Unpaid" } as const;
const Err = ({ e, ok }: { e?: string; ok?: string }) => (<>{e && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{e}</p>}{ok && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</p>}</>);

export default async function Owner({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const u = await requireOwnerUser();
  if (!ownerConfigured()) return null;
  if (!(await isUnlocked(u.id))) {
    return (
      <>
        <PageHeader title="Owner tools" sub="Enter your secret code to continue." art={false} />
        <Card className="max-w-md"><Err e={sp.error} />
          <form action={unlockAction} autoComplete="off" className="space-y-3"><div><label className="label" htmlFor="code">Secret code</label><PasswordInput id="code" name="code" autoComplete="off" required /></div><button className="btn">Unlock</button></form>
        </Card>
      </>
    );
  }
  const [schools, audit] = await Promise.all([
    db.school.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { students: true } } } }),
    db.auditLog.findMany({ where: { action: { startsWith: "owner_" } }, orderBy: { createdAt: "desc" }, take: 15 }).then(async (a) => [...a, ...(await db.auditLog.findMany({ where: { action: { startsWith: "support_" } }, orderBy: { createdAt: "desc" }, take: 15 }))].sort((x, y) => +y.createdAt - +x.createdAt).slice(0, 20)),
  ]);
  const names = new Map(schools.map((s) => [s.id, s.name]));
  return (
    <>
      <PageHeader title="Owner tools" sub="Free schools, complimentary access and support mode. Everything here is logged." art={false}>
        <form action={lockAction}><button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Lock now</button></form>
      </PageHeader>
      <Err e={sp.error} ok={sp.ok} />
      <Card title="Create a school without payment" className="mb-6">
        <form action={createFreeSchool} autoComplete="off" className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="n">School name</label><input id="n" name="name" className="input" required /></div>
          <div><label className="label" htmlFor="c">Code</label><input id="c" name="code" className="input" required placeholder="GREEN" /></div>
          <div><label className="label" htmlFor="a">Address</label><input id="a" name="address" className="input" /></div>
          <div><label className="label" htmlFor="an">Principal name</label><input id="an" name="adminName" className="input" required /></div>
          <div><label className="label" htmlFor="ae">Principal email</label><input id="ae" name="adminEmail" type="email" autoComplete="off" className="input" required /></div>
          <div><label className="label" htmlFor="ap">Initial password (8+)</label><PasswordInput id="ap" name="password" autoComplete="new-password" minLength={8} required /></div>
          <CompFields />
          <div className="sm:col-span-3 text-right"><button className="btn">Create free school</button></div>
        </form>
      </Card>
      <Card title="All schools" flush className="mb-6">
        <Table head={["School", "Students", "Access", "Free access", "Support"]}>{schools.map((s) => {
          const a = accessOf(s);
          return (
            <tr key={s.id}><td className="td font-medium">{s.name}<div className="text-xs text-slate-400">{s.code}</div></td><td className="td">{s._count.students}</td>
              <td className="td"><Badge tone={tone[a.state]}>{lbl[a.state]}</Badge>{a.until && <div className="mt-1 text-xs text-slate-500">{a.state === "COMPED" ? "free until" : "paid until"} {fmtDate(a.until)}</div>}{s.comped && !s.compedUntil && <div className="mt-1 text-xs text-slate-500">forever</div>}</td>
              <td className="td"><form action={setComp.bind(null, s.id)} className="grid max-w-[15rem] gap-1.5"><CompFields compact /><button className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Apply</button></form></td>
              <td className="td"><form action={enterSupport.bind(null, s.id)}><button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">Open (view-only)</button></form></td></tr>);
        })}</Table>
      </Card>
      <Card title="Recent owner activity" flush>
        <Table head={["When", "Action", "School"]}>{audit.map((l) => <tr key={l.id}><td className="td whitespace-nowrap">{fmtDate(l.createdAt)}</td><td className="td">{l.action.replace(/_/g, " ")}{l.detail ? ` · ${l.detail}` : ""}</td><td className="td">{l.schoolId ? names.get(l.schoolId) ?? "" : ""}</td></tr>)}</Table>
      </Card>
    </>
  );
}

function CompFields({ compact }: { compact?: boolean }) {
  return (
    <>
      <div className={compact ? "" : ""}>
        {!compact && <label className="label" htmlFor="mode">Free access</label>}
        <select id={compact ? undefined : "mode"} name="mode" defaultValue={compact ? "forever" : "forever"} className="input" aria-label="Free access mode">
          <option value="forever">Free forever</option><option value="months">Free for a period</option><option value="off">Remove free access</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input name="months" type="number" min={1} max={120} defaultValue={3} className="input w-20" aria-label="Months (if a period)" title="Months, used with “Free for a period”" />
        <input name="note" className="input flex-1" placeholder="Note (optional)" aria-label="Note" />
      </div>
    </>
  );
}
