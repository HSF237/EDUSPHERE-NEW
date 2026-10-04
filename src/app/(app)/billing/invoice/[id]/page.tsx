import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { PrintButton } from "@/components/print-button";
import { fmtDate } from "@/lib/utils";
import { CUSTOM, PLANS, TIERS, inr, type PlanCode, type TierCode } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const metadata = { title: "Invoice" };

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx({ allowLocked: true });
  if (ctx.role !== "ADMIN") notFound();
  const { id } = await params;
  const p = await db.billingPayment.findFirst({ where: { id, schoolId: ctx.schoolId, status: "PAID" }, include: { school: true } });
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 text-right"><PrintButton /></div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 print:border-0">
        <div className="flex items-center gap-4 border-b-2 border-brand-600 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-14 w-14 object-contain" />
          <div className="flex-1"><div className="text-xl font-extrabold text-brand-900">{SITE.name}</div><div className="text-sm text-slate-500">{SITE.operator} · {SITE.location}</div></div>
          <div className="text-right text-lg font-bold text-slate-700">{p.demo ? "DEMO INVOICE" : "INVOICE"}</div>
        </div>
        <div className="mt-4 flex justify-between text-sm"><span>Invoice no. <b>{p.invoiceNo}</b></span><span>Date <b>{p.paidAt ? fmtDate(p.paidAt) : ""}</b></span></div>
        <div className="my-4 text-sm"><div className="text-slate-500">Billed to</div><div className="font-medium">{p.school.name}</div>{p.school.address && <div className="text-slate-600">{p.school.address}</div>}</div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody><tr className="border-b"><td className="py-3">EduSphere {TIERS[p.tier as TierCode]?.label} · {PLANS[p.planCode as PlanCode]?.label} ({p.months} month{p.months > 1 ? "s" : ""}){p.kind === "INTRO" ? " · intro price" : ""}</td><td className="py-3 text-right">{inr(p.amount - p.addonAmount)}</td></tr>{p.addon && <tr className="border-b"><td className="py-3">{CUSTOM.label} add-on ({p.months / 12} year{p.months > 12 ? "s" : ""}): own logo, colours, signature and web address</td><td className="py-3 text-right">{inr(p.addonAmount)}</td></tr>}</tbody>
          <tfoot><tr><td className="pt-3 text-right font-semibold">Total paid</td><td className="pt-3 text-right text-lg font-extrabold text-brand-900">{inr(p.amount)}</td></tr></tfoot>
        </table>
        <p className="mt-6 text-xs text-slate-500">Payment reference: {p.paymentId ?? "—"}{p.demo ? " (demo payment, no money was charged)" : ""}</p>
        <p className="mt-6 text-center text-[11px] text-slate-400">This is a computer-generated invoice.</p>
      </div>
    </div>
  );
}
