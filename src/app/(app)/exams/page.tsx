import Link from "next/link";
import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Table, Badge, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { NewExam } from "./forms";

export const metadata = { title: "Exams & marks" };

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  if (ctx.role === "PARENT") {
    const { kids, kid } = await pickChild(ctx, sp.child);
    if (!kid) return (<><PageHeader title="Exams" /><Card><Empty title="No children linked" /></Card></>);
    const exams = await db.exam.findMany({ where: { classId: kid.classId, schoolId: ctx.schoolId, published: true }, orderBy: { startsOn: "desc" }, include: { marks: { where: { studentId: kid.id } } } });
    const upcoming = await db.exam.findMany({ where: { classId: kid.classId, schoolId: ctx.schoolId, published: false, startsOn: { gte: new Date() } }, include: { schedule: { include: { subject: true }, orderBy: { date: "asc" } } } });
    return (
      <>
        <PageHeader title="Exams & report cards" sub={`${kid.name} · Class ${kid.class.name}`}>
          {kids.length > 1 && <form><select name="child" defaultValue={kid.id} className="input">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select> <button className="btn-ghost">Switch</button></form>}
        </PageHeader>
        {upcoming.map((u) => (<Card key={u.id} title={`Upcoming: ${u.name}`} className="mb-6"><ul className="grid gap-2 sm:grid-cols-3 text-sm">{u.schedule.map((s) => <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2"><b>{s.subject.name}</b><div className="text-xs text-slate-500">{fmtDate(s.date)} · {s.startTime}</div></li>)}</ul></Card>))}
        <Card title="Published results" flush>
          {exams.length === 0 ? <Empty title="No results published yet" /> : (
            <Table head={["Exam", "Date", "Total", "Percentage", ""]}>{exams.map((e) => { const tot = e.marks.reduce((a, m) => a + m.score, 0); const max = e.marks.length * e.maxMarks; return (
              <tr key={e.id}><td className="td font-medium">{e.name}</td><td className="td">{fmtDate(e.startsOn)}</td><td className="td">{tot}/{max}</td><td className="td">{max ? Math.round((tot / max) * 100) : 0}%</td><td className="td"><Link className="text-brand-600 hover:underline" href={`/exams/${e.id}/report?student=${kid.id}`}>Report card</Link></td></tr>);})}</Table>
          )}
        </Card>
      </>
    );
  }
  const classes = await db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" } });
  const exams = await db.exam.findMany({ where: { schoolId: ctx.schoolId, classId: { in: ctx.classIds } }, include: { class: true, _count: { select: { marks: true } } }, orderBy: { startsOn: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Exams & marks" sub="Create exams, enter marks by subject and publish results to parents." />
      {ctx.role === "ADMIN" && <Card title="Create exam" className="mb-6"><NewExam classes={classes.map((c) => ({ id: c.id, name: c.name }))} /></Card>}
      <Card title="Exams" flush>
        {exams.length === 0 ? <Empty title="No exams yet" /> : (
          <Table head={["Exam", "Class", "Starts", "Max / Pass", "Marks entered", "Status"]}>{exams.map((e) => (
            <tr key={e.id}><td className="td font-medium"><Link className="text-brand-600 hover:underline" href={`/exams/${e.id}`}>{e.name}</Link></td><td className="td">{e.class.name}</td><td className="td">{fmtDate(e.startsOn)}</td><td className="td">{e.maxMarks} / {e.passMarks}</td><td className="td">{e._count.marks}</td><td className="td"><Badge tone={e.published ? "green" : "amber"}>{e.published ? "Published" : "Draft"}</Badge></td></tr>))}</Table>
        )}
      </Card>
    </>
  );
}
