import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { PrintButton } from "@/components/print-button";
import { DocHead, SignBlock } from "@/components/doc-head";
import { schoolBrand } from "@/lib/school-brand";
import { fmtDate, inr } from "@/lib/utils";

export const metadata = { title: "Fee receipt" };

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  const { id } = await params;
  const p = await db.feePayment.findFirst({ where: { id, schoolId: ctx.schoolId }, include: { student: { include: { class: true } }, item: true } });
  if (!p) notFound();
  if (ctx.role === "PARENT" ? !ctx.childIds.includes(p.studentId) : !can(ctx, "FEES")) notFound();
  const b = await schoolBrand(ctx.schoolId);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 text-right"><PrintButton /></div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 print:border-0">
        <DocHead b={b} line="Fee receipt" />
        <div className="mt-4 flex justify-between text-sm"><span>Receipt no. <b>{p.receiptNo}</b></span><span>Date <b>{fmtDate(p.paidOn)}</b></span></div>
        <dl className="my-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Student</dt><dd className="font-medium">{p.student.name}</dd></div>
          <div><dt className="text-slate-500">Class / Roll</dt><dd className="font-medium">{p.student.class.name} / {p.student.rollNo}</dd></div>
          <div><dt className="text-slate-500">Admission no.</dt><dd className="font-medium">{p.student.admissionNo}</dd></div>
          <div><dt className="text-slate-500">Towards</dt><dd className="font-medium">{p.item?.name ?? "Fees (oldest dues first)"}</dd></div>
          <div><dt className="text-slate-500">Mode</dt><dd className="font-medium">{p.mode}{p.reference ? ` · ${p.reference}` : ""}</dd></div>
          {p.note && <div><dt className="text-slate-500">Note</dt><dd className="font-medium">{p.note}</dd></div>}
        </dl>
        <div className="rounded-lg bg-slate-50 p-4 text-center"><div className="text-xs uppercase tracking-wide text-slate-500">Amount received</div><div className="text-3xl font-extrabold text-brand-900">{inr(p.amount)}</div></div>
        <SignBlock b={b} />
        <p className="mt-6 text-center text-[11px] text-slate-400">This is a computer-generated receipt.</p>
      </div>
    </div>
  );
}
