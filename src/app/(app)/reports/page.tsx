import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Progress, Empty } from "@/components/ui";
import { pct } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function Reports() {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return null;
  const since = new Date(); since.setUTCDate(since.getUTCDate() - 30);
  const classes = await db.class.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" } });
  const att = await Promise.all(classes.map(async (c) => {
    const g = await db.attendanceRecord.groupBy({ by: ["status"], where: { session: { classId: c.id, status: "APPROVED", date: { gte: since } } }, _count: true });
    const t = g.reduce((a, x) => a + x._count, 0); const p = g.filter((x) => x.status === "PRESENT" || x.status === "LATE").reduce((a, x) => a + x._count, 0);
    return { c, t, rate: pct(p, t) };
  }));
  const absentees = await db.attendanceRecord.groupBy({ by: ["studentId"], where: { status: "ABSENT", session: { schoolId: ctx.schoolId, status: "APPROVED", date: { gte: since } } }, _count: true, orderBy: { _count: { studentId: "desc" } }, take: 10 });
  const names = new Map((await db.student.findMany({ where: { id: { in: absentees.map((a) => a.studentId) } }, include: { class: true } })).map((s) => [s.id, `${s.name} (${s.class.name})`]));
  const marks = await db.mark.groupBy({ by: ["subjectId"], where: { exam: { schoolId: ctx.schoolId, published: true } }, _avg: { score: true } });
  const subj = new Map((await db.subject.findMany({ where: { schoolId: ctx.schoolId } })).map((s) => [s.id, s.name]));
  const hw = await db.homeworkSubmission.groupBy({ by: ["done"], where: { homework: { schoolId: ctx.schoolId } }, _count: true });
  const hd = hw.find((h) => h.done)?._count ?? 0; const ht = hw.reduce((a, h) => a + h._count, 0);
  return (
    <>
      <PageHeader title="Reports & analytics" sub="Last 30 days of approved attendance and all published results." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Attendance by class" flush>{att.every((a) => !a.t) ? <Empty title="No approved attendance yet" /> : <Table head={["Class", "Rate", ""]}>{att.map(({ c, rate, t }) => <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td w-1/2">{t ? <Progress value={rate} tone={rate >= 90 ? "green" : rate >= 80 ? "amber" : "red"} /> : "—"}</td><td className="td">{t ? `${rate}%` : ""}</td></tr>)}</Table>}</Card>
        <Card title="Most absences (30 days)" flush>{absentees.length === 0 ? <Empty title="No absences recorded" /> : <Table head={["Student", "Days absent"]}>{absentees.map((a) => <tr key={a.studentId}><td className="td">{names.get(a.studentId)}</td><td className="td font-semibold">{a._count}</td></tr>)}</Table>}</Card>
        <Card title="Average marks by subject" flush>{marks.length === 0 ? <Empty title="No published results" /> : <Table head={["Subject", "Average", ""]}>{marks.map((m) => { const v = Math.round(m._avg.score ?? 0); return <tr key={m.subjectId}><td className="td font-medium">{subj.get(m.subjectId)}</td><td className="td w-1/2"><Progress value={v} /></td><td className="td">{v}</td></tr>; })}</Table>}</Card>
        <Card title="Homework completion"><div className="text-3xl font-bold">{pct(hd, ht)}%</div><p className="mb-3 text-sm text-slate-500">{hd} of {ht} assignments completed across the school</p><Progress value={pct(hd, ht)} tone="green" /></Card>
      </div>
    </>
  );
}
