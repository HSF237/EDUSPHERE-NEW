import Link from "next/link";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { accessOf } from "@/lib/billing";
import { GRACE_DAYS, INTRO_MONTHS, PLANS, TIERS, inr, priceFor, type PlanCode, type TierCode } from "@/lib/plans";
import { razorpayLive } from "@/lib/razorpay";
import { PayPanel, type Matrix } from "./pay-panel";
import { DataPromise } from "./promise";
import { setCancelled } from "./actions";

export const metadata = { title: "Billing" };

const tone = { COMPED: "indigo", ACTIVE: "green", GRACE: "amber", LOCKED: "red", SETUP: "amber" } as const;
const label = { COMPED: "Complimentary", ACTIVE: "Active", GRACE: "Payment due", LOCKED: "Read-only", SETUP: "Not activated" } as const;

export default async function Billing({ searchParams }: { searchParams: Promise<{ locked?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx({ allowLocked: true });
  if (ctx.role === "SUPER_ADMIN") return <p className="text-sm text-slate-500">Billing is per school. Open a school in support mode to see its billing.</p>;
  const school = await db.school.findUnique({ where: { id: ctx.schoolId } });
  if (!school) return null;
  const a = accessOf(school);
  if (ctx.role !== "ADMIN") {
    return (<><PageHeader title="Billing" art={false} /><Card><p className="text-sm text-slate-600">Billing is managed by your principal. {a.state === "LOCKED" || a.state === "SETUP" ? "The school account is currently read-only until the plan is renewed. Nothing has been deleted." : "Everything is working normally."}</p></Card></>);
  }
  const [students, history] = await Promise.all([
    db.student.count({ where: { schoolId: school.id } }),
    db.billingPayment.findMany({ where: { schoolId: school.id, status: "PAID" }, orderBy: { paidAt: "desc" }, take: 30 }),
  ]);
  const matrix: Matrix = Object.fromEntries((Object.keys(TIERS) as TierCode[]).map((t) => [t, {
    label: TIERS[t].label, students: TIERS[t].students,
    plans: Object.fromEntries((Object.keys(PLANS) as PlanCode[]).map((p) => [p, { ...priceFor(t, p, school.introMonthsLeft), label: PLANS[p].label }])),
  }]));
  const limit = (TIERS[school.tier as TierCode] ?? TIERS.STARTER).students;
  const over = students > limit && a.state !== "COMPED";
  return (
    <>
      <PageHeader title="Billing" sub="Your plan, payments and invoices." art={false} />
      {sp.welcome && <p role="status" className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">Welcome to EduSphere! Choose a plan below to activate your school. Until then your account is read-only.</p>}
      {sp.locked && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Your account is read-only, so that change wasn’t saved. Renew below to continue. Your data is safe.</p>}
      <Card title="Your plan" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={tone[a.state]}>{label[a.state]}</Badge>
          {a.state === "COMPED" && <span className="text-sm text-slate-600">{school.compNote ?? "Complimentary access"}{a.until ? ` until ${fmtDate(a.until)}` : " with no end date"}.</span>}
          {(a.state === "ACTIVE" || a.state === "GRACE" || a.state === "LOCKED") && a.until && <span className="text-sm text-slate-600">{a.state === "ACTIVE" ? "Paid until" : "Expired on"} <b>{fmtDate(a.until)}</b>{a.state === "GRACE" && a.graceEnds && <> · full access continues until {fmtDate(a.graceEnds)}</>}</span>}
          {school.planCode && <span className="text-sm text-slate-500">{TIERS[school.tier as TierCode]?.label} · {PLANS[school.planCode as PlanCode]?.label}</span>}
        </div>
        {a.state === "GRACE" && <p className="mt-3 text-sm text-amber-800">Your plan has ended. You have {GRACE_DAYS} days of full access to renew before the account becomes read-only.</p>}
        {a.state === "LOCKED" && <p className="mt-3 text-sm text-slate-600">The account is read-only. You can view and export everything; renew to make changes again. Nothing has been deleted.</p>}
        {over && <p className="mt-3 text-sm text-amber-800">You have {students.toLocaleString("en-IN")} students, above the {limit.toLocaleString("en-IN")} included in your tier. Please choose a larger tier at renewal.</p>}
        {(a.state === "ACTIVE" || a.state === "GRACE") && (
          <form action={setCancelled.bind(null, !school.cancelledAt)} className="mt-4">
            <button className="text-xs text-slate-500 underline hover:text-slate-700">{school.cancelledAt ? "Undo cancellation" : "Cancel at the end of this period"}</button>
            {school.cancelledAt && <span className="ml-2 text-xs text-slate-500">Marked as cancelled; the plan won’t be renewed. Your data stays.</span>}
          </form>
        )}
      </Card>
      {a.state !== "COMPED" && (
        <Card title={a.state === "ACTIVE" ? "Extend or change your plan" : "Choose a plan"} className="mb-6">
          <p className="mb-4 text-sm text-slate-500">First {INTRO_MONTHS} months on the monthly plan are at the intro price. 1-year and 2-year plans save 28%. {a.state === "ACTIVE" && "Payments add time to your current period."}</p>
          <PayPanel matrix={matrix} tier={school.tier} live={razorpayLive()} />
        </Card>
      )}
      <Card title="Payment history" flush className="mb-6">
        {history.length === 0 ? <p className="p-5 text-sm text-slate-500">No payments yet.</p> : (
          <Table head={["Date", "Plan", "Months", "Amount", "Invoice"]}>{history.map((h) => (
            <tr key={h.id}><td className="td">{h.paidAt ? fmtDate(h.paidAt) : ""}</td><td className="td">{TIERS[h.tier as TierCode]?.label} · {PLANS[h.planCode as PlanCode]?.label}{h.demo && <span className="ml-2"><Badge tone="amber">Demo</Badge></span>}</td><td className="td">{h.months}</td><td className="td">{inr(h.amount)}</td><td className="td"><Link className="text-brand-600 hover:underline" href={`/billing/invoice/${h.id}`}>{h.invoiceNo}</Link></td></tr>))}</Table>
        )}
      </Card>
      <Card title="Our promise about your data"><DataPromise /></Card>
    </>
  );
}
