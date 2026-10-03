import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Stat, Table, Badge } from "@/components/ui";
import { fmtDate, pct } from "@/lib/utils";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") notFound();
  const { id } = await params;
  const s = await db.student.findFirst({ where: { id, schoolId: ctx.schoolId, classId: { in: ctx.classIds } }, include: { class: true, guardians: { include: { user: true } } } });
  if (!s) notFound();
  const [grp, marks, leaves] = await Promise.all([
    db.attendanceRecord.groupBy({ by: ["status"], where: { studentId: s.id, session: { status: "APPROVED" } }, _count: true }),
    db.mark.findMany({ where: { studentId: s.id }, include: { exam: true } }),
    db.leaveRequest.findMany({ where: { studentId: s.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const subjects = new Map((await db.subject.findMany({ where: { schoolId: ctx.schoolId } })).map((x) => [x.id, x.name]));
  const total = grp.reduce((a, g) => a + g._count, 0); const pres = grp.filter((g) => g.status === "PRESENT" || g.status === "LATE").reduce((a, g) => a + g._count, 0);
  const g = (k: string) => grp.find((x) => x.status === k)?._count ?? 0;
  return (
    <>
      <PageHeader title={s.name} sub={`Class ${s.class.name} · Roll ${s.rollNo} · ${s.admissionNo}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4"><Stat label="Attendance" value={`${pct(pres, total)}%`} tone="indigo" /><Stat label="Days absent" value={g("ABSENT")} tone="red" /><Stat label="Days late" value={g("LATE")} tone="amber" /><Stat label="Date of birth" value={s.dob ? fmtDate(s.dob) : "—"} /></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Guardians">{s.guardians.length === 0 ? <p className="text-sm text-slate-500">No parent account linked.</p> : s.guardians.map((x) => <div key={x.id} className="text-sm"><b>{x.user.name}</b> · {x.user.email}</div>)}</Card>
        <Card title="Recent leave">{leaves.length === 0 ? <p className="text-sm text-slate-500">None.</p> : leaves.map((l) => <div key={l.id} className="flex justify-between text-sm"><span>{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</span><Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{l.status.toLowerCase()}</Badge></div>)}</Card>
        <Card title="Marks" className="lg:col-span-2" flush>
          {marks.length === 0 ? <p className="p-5 text-sm text-slate-500">No marks recorded.</p> : <Table head={["Exam", "Subject", "Score", "Max"]}>{marks.map((m) => <tr key={m.id}><td className="td">{m.exam.name}</td><td className="td">{subjects.get(m.subjectId)}</td><td className="td font-medium">{m.score}</td><td className="td">{m.exam.maxMarks}</td></tr>)}</Table>}
        </Card>
      </div>
    </>
  );
}
