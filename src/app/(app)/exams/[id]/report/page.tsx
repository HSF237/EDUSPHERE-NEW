import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds } from "@/lib/scope";
import { fmtDate, grade } from "@/lib/utils";

export const metadata = { title: "Report card" };

export default async function ReportCard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ student?: string }> }) {
  const ctx = await getCtx();
  const { id } = await params; const { student } = await searchParams;
  const exam = await db.exam.findFirst({ where: { id, schoolId: ctx.schoolId }, include: { class: true, schedule: { include: { subject: true } } } });
  if (!exam || !student) notFound();
  if (ctx.role === "PARENT" ? !ctx.childIds.includes(student) || !exam.published : !(await scopeClassIds(ctx, "EXAMS")).includes(exam.classId)) notFound();
  const st = await db.student.findFirst({ where: { id: student, classId: exam.classId, schoolId: ctx.schoolId } });
  if (!st) notFound();
  const marks = await db.mark.findMany({ where: { examId: id, studentId: st.id } });
  const all = await db.mark.groupBy({ by: ["studentId"], where: { examId: id }, _sum: { score: true } });
  const sorted = all.map((a) => a._sum.score ?? 0).sort((a, b) => b - a);
  const rows = exam.schedule.map((s) => { const m = marks.find((x) => x.subjectId === s.subjectId); return { name: s.subject.name, score: m?.score ?? null }; });
  const tot = marks.reduce((a, m) => a + m.score, 0); const max = exam.maxMarks * rows.length; const pc = max ? Math.round((tot / max) * 100) : 0;
  const pass = rows.every((r) => r.score !== null && r.score >= exam.passMarks);
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 print:border-0">
      <div className="border-b border-slate-200 pb-4 text-center"><div className="text-xl font-bold">{ctx.user.school?.name}</div><div className="text-sm text-slate-500">Report card · {exam.name}</div></div>
      <dl className="my-4 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-slate-500">Student</dt><dd className="font-medium">{st.name}</dd></div><div><dt className="text-slate-500">Class / Roll</dt><dd className="font-medium">{exam.class.name} / {st.rollNo}</dd></div><div><dt className="text-slate-500">Admission no.</dt><dd className="font-medium">{st.admissionNo}</dd></div><div><dt className="text-slate-500">Exam date</dt><dd className="font-medium">{fmtDate(exam.startsOn)}</dd></div></dl>
      <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="th">Subject</th><th className="th text-right">Marks</th><th className="th text-right">Max</th><th className="th text-right">Grade</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map((r) => (<tr key={r.name}><td className="td">{r.name}</td><td className="td text-right">{r.score ?? "—"}</td><td className="td text-right">{exam.maxMarks}</td><td className="td text-right">{r.score === null ? "—" : r.score < exam.passMarks ? "F" : grade((r.score / exam.maxMarks) * 100)}</td></tr>))}</tbody></table>
      <div className="mt-4 flex justify-between rounded-lg bg-slate-50 p-4 text-sm"><span>Total <b>{tot}/{max}</b></span><span>Percentage <b>{pc}%</b></span><span>Rank <b>{sorted.indexOf(tot) + 1}/{sorted.length}</b></span><span className={pass ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{pass ? "PASS" : "NEEDS IMPROVEMENT"}</span></div>
    </div>
  );
}
