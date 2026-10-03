import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { closeHomework } from "../actions";
import { Toggle } from "./toggle";

export default async function HomeworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") notFound();
  const { id } = await params;
  const hw = await db.homework.findFirst({ where: { id, schoolId: ctx.schoolId, classId: { in: ctx.classIds } }, include: { class: true, subject: true } });
  if (!hw) notFound();
  const students = await db.student.findMany({ where: { classId: hw.classId, active: true }, orderBy: { rollNo: "asc" }, include: { submissions: { where: { homeworkId: hw.id } } } });
  const done = students.filter((s) => s.submissions[0]?.done).length;
  return (
    <>
      <PageHeader art="homework" title={hw.title} sub={`${hw.class.name} · ${hw.subject.name} · Due ${fmtDate(hw.dueOn)}`}>
        <Badge tone={hw.status === "ACTIVE" ? "green" : "slate"}>{hw.status.toLowerCase()}</Badge>
        {ctx.role === "TEACHER" && hw.status === "ACTIVE" && <form action={closeHomework.bind(null, hw.id)}><button className="btn-ghost">Close homework</button></form>}
      </PageHeader>
      <Card className="mb-6"><p className="whitespace-pre-wrap text-sm">{hw.description}</p></Card>
      <Card title={`Completion · ${done}/${students.length}`} flush>
        <ul className="divide-y divide-slate-100">{students.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-5 py-2.5 text-sm"><span><span className="mr-3 text-slate-400">{s.rollNo}</span>{s.name}</span>{ctx.role === "TEACHER" ? <Toggle homeworkId={hw.id} studentId={s.id} done={!!s.submissions[0]?.done} /> : <Badge tone={s.submissions[0]?.done ? "green" : "slate"}>{s.submissions[0]?.done ? "done" : "pending"}</Badge>}</li>
        ))}</ul>
      </Card>
    </>
  );
}
