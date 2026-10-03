import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds } from "@/lib/scope";
import { schoolBrand } from "@/lib/school-brand";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "ID cards" };

/* eslint-disable @next/next/no-img-element */
export default async function IdCards({ searchParams }: { searchParams: Promise<{ class?: string; student?: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") notFound();
  const sp = await searchParams;
  const scope = await scopeClassIds(ctx, "STUDENTS");
  const st = sp.student ? await db.student.findFirst({ where: { id: sp.student, schoolId: ctx.schoolId }, include: { class: true, guardians: { include: { user: { select: { phone: true } } } } } }) : null;
  if (sp.student && (!st || !scope.includes(st.classId))) notFound();
  if (!sp.student && (!sp.class || !scope.includes(sp.class))) notFound();
  const list = st ? [st] : await db.student.findMany({ where: { schoolId: ctx.schoolId, classId: sp.class, active: true }, orderBy: { rollNo: "asc" }, include: { class: true, guardians: { include: { user: { select: { phone: true } } } } } });
  const b = await schoolBrand(ctx.schoolId);
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between"><p className="text-sm text-slate-500">{list.length} card{list.length === 1 ? "" : "s"} · print on card stock or paper and cut out.</p><PrintButton label="Print ID cards" /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
        {list.map((s) => {
          const phone = s.guardians.map((g) => g.user.phone).find(Boolean);
          return (
            <div key={s.id} className="break-inside-avoid overflow-hidden rounded-xl border border-slate-300 bg-white" style={{ aspectRatio: "86 / 54" }}>
              <div className="flex items-center gap-2 bg-brand-600 px-3 py-1.5 text-white">
                {b.logo ? <img src={b.logo} alt="" className="h-7 w-7 rounded bg-white object-contain p-0.5" /> : <img src="/logo-icon.png" alt="" className="h-7 w-7 rounded bg-white object-contain p-0.5" />}
                <div className="min-w-0 truncate text-xs font-bold leading-tight">{b.name}</div>
              </div>
              <div className="flex gap-3 p-3">
                {s.photoFileId ? <img src={`/api/files/${s.photoFileId}`} alt="" className="h-24 w-[72px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200" /> : <div className="grid h-24 w-[72px] shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-400">Photo</div>}
                <div className="min-w-0 text-[11px] leading-snug">
                  <div className="truncate text-sm font-extrabold text-brand-900">{s.name}</div>
                  <div>Class <b>{s.class.name}</b> · Roll <b>{s.rollNo}</b></div>
                  <div>Adm. no. <b>{s.admissionNo}</b></div>
                  {s.bloodGroup && <div>Blood group <b>{s.bloodGroup}</b></div>}
                  {phone && <div>Parent: <b>{phone}</b></div>}
                  <div className="mt-1 flex items-end gap-2">{b.signature ? <img src={b.signature} alt="" className="h-6 object-contain" /> : null}<span className="text-[9px] text-slate-500">{b.title}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
