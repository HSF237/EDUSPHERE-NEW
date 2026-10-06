import Link from "next/link";
import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Table, Badge, Empty } from "@/components/ui";
import { fmtDate, todayUTC } from "@/lib/utils";
import { HomeworkHelp } from "@/components/assistant/homework-help";
import { NewHomework } from "./new-form";

export const metadata = { title: "Homework" };

export default async function HomeworkPage({ searchParams }: { searchParams: Promise<{ child?: string; show?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const today = todayUTC();
  if ((ctx.role === "PARENT" || ctx.role === "STUDENT")) {
    const { kids, kid } = await pickChild(ctx, sp.child);
    if (!kid) return (<><PageHeader title="Homework" /><Card><Empty title="No children linked" /></Card></>);
    const list = await db.homework.findMany({ where: { classId: kid.classId, schoolId: ctx.schoolId }, include: { subject: true, submissions: { where: { studentId: kid.id } } }, orderBy: { dueOn: "desc" }, take: 50 });
    return (
      <>
        <PageHeader title="Homework" sub={`${kid.name} · Class ${kid.class.name}`}>
          {kids.length > 1 && <form><select name="child" defaultValue={kid.id} className="input" aria-label="Child">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select> <button className="btn-ghost">Switch</button></form>}
        </PageHeader>
        <div className="space-y-3">
          {list.length === 0 && <Card><Empty title="No homework yet" /></Card>}
          {list.map((h) => {
            const done = h.submissions[0]?.done; const overdue = h.dueOn < today && !done;
            return (<Card key={h.id}><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{h.title}</div><div className="text-xs text-slate-500">{h.subject.name} · Due {fmtDate(h.dueOn)}</div></div>
              <Badge tone={done ? "green" : overdue ? "red" : "amber"}>{done ? "Completed" : overdue ? "Overdue" : "Pending"}</Badge></div><p className="mt-2 text-sm text-slate-600">{h.description}</p><HomeworkHelp id={h.id} />{h.fileId && <a className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline" href={`/api/files/${h.fileId}`} target="_blank" rel="noreferrer">📎 Attachment</a>}</Card>);
          })}
        </div>
      </>
    );
  }
  const classes = await db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" }, include: { subjects: { where: ctx.role === "TEACHER" ? { teacherId: ctx.teacherId! } : {}, include: { subject: true } } } });
  const subjectsByClass = Object.fromEntries(classes.map((c) => [c.id, c.subjects.map((s) => ({ id: s.subjectId, name: s.subject.name }))]));
  const list = await db.homework.findMany({ where: { schoolId: ctx.schoolId, classId: { in: ctx.classIds }, ...(sp.show === "closed" ? { status: "CLOSED" } : { status: "ACTIVE" }) }, include: { class: true, subject: true, submissions: true }, orderBy: { dueOn: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Homework" sub={ctx.role === "ADMIN" ? "Homework assigned across all classes (read-only)." : "Assign work and track completion per student."}>
        <Link className="btn-ghost" href={sp.show === "closed" ? "/homework" : "/homework?show=closed"}>{sp.show === "closed" ? "Show active" : "Show closed"}</Link>
      </PageHeader>
      {ctx.role === "TEACHER" && <Card title="Assign new homework" className="mb-6"><NewHomework classes={classes.map((c) => ({ id: c.id, name: c.name }))} subjectsByClass={subjectsByClass} /></Card>}
      <Card title={sp.show === "closed" ? "Closed homework" : "Active homework"} flush>
        {list.length === 0 ? <Empty title="Nothing here yet" /> : (
          <Table head={["Title", "Class", "Subject", "Due", "Completed"]}>
            {list.map((h) => { const d = h.submissions.filter((s) => s.done).length; return (
              <tr key={h.id}><td className="td font-medium"><Link className="text-brand-600 hover:underline" href={`/homework/${h.id}`}>{h.title}</Link></td><td className="td">{h.class.name}</td><td className="td">{h.subject.name}</td><td className="td">{fmtDate(h.dueOn)}</td><td className="td">{d}/{h.submissions.length}</td></tr>);})}
          </Table>
        )}
      </Card>
    </>
  );
}
