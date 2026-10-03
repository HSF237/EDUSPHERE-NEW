import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Badge } from "@/components/ui";
import { fmtDate, grade } from "@/lib/utils";
import { MarksEntry, PublishButton } from "../forms";

export default async function ExamDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ subject?: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") notFound();
  const { id } = await params; const sp = await searchParams;
  const exam = await db.exam.findFirst({ where: { id, schoolId: ctx.schoolId, classId: { in: ctx.classIds } }, include: { class: true, schedule: { include: { subject: true }, orderBy: { date: "asc" } } } });
  if (!exam) notFound();
  const teachable = ctx.role === "ADMIN" ? exam.schedule.map((s) => s.subject) : (await db.classSubject.findMany({ where: { classId: exam.classId, teacherId: ctx.teacherId! }, include: { subject: true } })).map((c) => c.subject);
  const subject = teachable.find((s) => s.id === sp.subject) ?? teachable[0];
  const students = await db.student.findMany({ where: { classId: exam.classId, active: true }, orderBy: { rollNo: "asc" }, include: { marks: { where: { examId: exam.id } } } });
  const subjects = exam.schedule.map((s) => s.subject);
  const results = students.map((s) => { const tot = s.marks.reduce((a, m) => a + m.score, 0); const max = subjects.length * exam.maxMarks; const fails = s.marks.filter((m) => m.score < exam.passMarks).length; return { s, tot, pct: max ? Math.round((tot / max) * 100) : 0, fails, complete: s.marks.length === subjects.length }; });
  const ranked = [...results].filter((r) => r.complete).sort((a, b) => b.tot - a.tot);
  return (
    <>
      <PageHeader art="exams" title={`${exam.name} · ${exam.class.name}`} sub={`Max ${exam.maxMarks}, pass ${exam.passMarks} · starts ${fmtDate(exam.startsOn)}`}>
        <Badge tone={exam.published ? "green" : "amber"}>{exam.published ? "Published" : "Draft"}</Badge>
        {ctx.role === "ADMIN" && <PublishButton examId={exam.id} published={exam.published} />}
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title={subject ? `Enter marks — ${subject.name}` : "Enter marks"} className="lg:col-span-2" flush>
          <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-3">{teachable.map((s) => <Link key={s.id} href={`/exams/${exam.id}?subject=${s.id}`} className={`rounded-full px-3 py-1 text-xs font-medium ${s.id === subject?.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>{s.name}</Link>)}</div>
          {subject ? <MarksEntry key={subject.id} examId={exam.id} subjectId={subject.id} max={exam.maxMarks} rows={students.map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo, score: String(s.marks.find((m) => m.subjectId === subject.id)?.score ?? "") }))} /> : <p className="p-5 text-sm text-slate-500">You do not teach any subject in this class.</p>}
        </Card>
        <Card title="Results" className="lg:col-span-3" flush>
          <Table head={["Roll", "Student", "Total", "%", "Grade", "Rank", ""]}>{results.map((r) => { const rank = ranked.findIndex((x) => x.s.id === r.s.id) + 1; return (
            <tr key={r.s.id}><td className="td">{r.s.rollNo}</td><td className="td font-medium">{r.s.name}</td><td className="td">{r.tot}</td><td className="td">{r.pct}%</td>
              <td className="td">{r.complete ? <Badge tone={r.fails ? "red" : "green"}>{r.fails ? "Fail" : grade(r.pct)}</Badge> : <Badge>pending</Badge>}</td><td className="td">{rank || "—"}</td>
              <td className="td"><Link className="text-brand-600 hover:underline" href={`/exams/${exam.id}/report?student=${r.s.id}`}>Report</Link></td></tr>);})}</Table>
        </Card>
      </div>
    </>
  );
}
