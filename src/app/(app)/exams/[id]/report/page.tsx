import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds } from "@/lib/scope";
import { fmtDate, grade } from "@/lib/utils";
import { schoolBrand, type SchoolBrand } from "@/lib/school-brand";
import { DocHead, SignBlock } from "@/components/doc-head";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Report card" };

type Exam = NonNullable<Awaited<ReturnType<typeof loadExam>>>;
const loadExam = (id: string, schoolId: string) => db.exam.findFirst({ where: { id, schoolId }, include: { class: true, schedule: { include: { subject: true } } } });

export default async function ReportCard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ student?: string; all?: string }> }) {
  const ctx = await getCtx();
  const { id } = await params; const { student, all } = await searchParams;
  const exam = await loadExam(id, ctx.schoolId);
  if (!exam || (!student && !all)) notFound();
  const staffOk = ctx.role !== "PARENT" && (await scopeClassIds(ctx, "EXAMS")).includes(exam.classId);
  if (all ? !staffOk : ctx.role === "PARENT" ? !ctx.childIds.includes(student!) || !exam.published : !staffOk) notFound();
  const students = await db.student.findMany({ where: { schoolId: ctx.schoolId, classId: exam.classId, active: true, ...(all ? {} : { id: student }) }, orderBy: { rollNo: "asc" } });
  if (!students.length) notFound();
  const [b, marks, totals, att] = await Promise.all([
    schoolBrand(ctx.schoolId),
    db.mark.findMany({ where: { examId: id, studentId: { in: students.map((s) => s.id) } } }),
    db.mark.groupBy({ by: ["studentId"], where: { examId: id }, _sum: { score: true } }),
    db.attendanceRecord.groupBy({ by: ["studentId", "status"], where: { studentId: { in: students.map((s) => s.id) }, session: { status: "APPROVED" } }, _count: true }),
  ]);
  const sorted = totals.map((a) => a._sum.score ?? 0).sort((a, b) => b - a);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 text-right"><PrintButton label={all ? `Print ${students.length} report cards` : "Print / Save as PDF"} /></div>
      {students.map((st) => {
        const a = att.filter((x) => x.studentId === st.id);
        const days = a.reduce((n, x) => n + x._count, 0); const present = a.filter((x) => x.status !== "ABSENT").reduce((n, x) => n + x._count, 0);
        return <Card key={st.id} b={b} exam={exam} st={st} marks={marks.filter((m) => m.studentId === st.id)} sorted={sorted} attPct={days ? Math.round((present / days) * 100) : null} />;
      })}
    </div>
  );
}

function Card({ b, exam, st, marks, sorted, attPct }: { b: SchoolBrand; exam: Exam; st: { id: string; name: string; rollNo: number; admissionNo: string; photoFileId: string | null }; marks: { subjectId: string; score: number }[]; sorted: number[]; attPct: number | null }) {
  const rows = exam.schedule.map((s) => { const m = marks.find((x) => x.subjectId === s.subjectId); return { name: s.subject.name, score: m?.score ?? null }; });
  const tot = marks.reduce((a, m) => a + m.score, 0); const max = exam.maxMarks * rows.length; const pc = max ? Math.round((tot / max) * 100) : 0;
  const pass = rows.every((r) => r.score !== null && r.score >= exam.passMarks);
  return (
    <div className="print-page mb-6 rounded-xl border border-slate-200 bg-white p-8 print:mb-0 print:border-0">
      <DocHead b={b} line={`Report card · ${exam.name}`} />
      <div className="my-4 flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {st.photoFileId && <img src={`/api/files/${st.photoFileId}`} alt="" className="h-24 w-20 rounded-lg object-cover ring-1 ring-slate-200" />}
        <dl className="grid flex-1 grid-cols-2 gap-2 text-sm"><div><dt className="text-slate-500">Student</dt><dd className="font-medium">{st.name}</dd></div><div><dt className="text-slate-500">Class / Roll</dt><dd className="font-medium">{exam.class.name} / {st.rollNo}</dd></div><div><dt className="text-slate-500">Admission no.</dt><dd className="font-medium">{st.admissionNo}</dd></div><div><dt className="text-slate-500">Exam date</dt><dd className="font-medium">{fmtDate(exam.startsOn)}</dd></div>{attPct !== null && <div><dt className="text-slate-500">Attendance</dt><dd className="font-medium">{attPct}%</dd></div>}</dl>
      </div>
      <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="th">Subject</th><th className="th text-right">Marks</th><th className="th text-right">Max</th><th className="th text-right">Grade</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map((r) => (<tr key={r.name}><td className="td">{r.name}</td><td className="td text-right">{r.score ?? "—"}</td><td className="td text-right">{exam.maxMarks}</td><td className="td text-right">{r.score === null ? "—" : r.score < exam.passMarks ? "F" : grade((r.score / exam.maxMarks) * 100)}</td></tr>))}</tbody></table>
      <div className="mt-4 flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-4 text-sm"><span>Total <b>{tot}/{max}</b></span><span>Percentage <b>{pc}%</b></span><span>Rank <b>{sorted.indexOf(tot) + 1}/{sorted.length}</b></span><span className={pass ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{pass ? "PASS" : "NEEDS IMPROVEMENT"}</span></div>
      <SignBlock b={b} />
    </div>
  );
}
