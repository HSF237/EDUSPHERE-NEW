import Link from "next/link";
import { db } from "@/lib/db";
import type { Ctx } from "@/lib/scope";
import { Card, DashBanner, Chip, Empty } from "@/components/ui";
import { SceneLaptop } from "@/components/art";
import { HomeworkHelp } from "./homework-help";
import { fmtDate } from "@/lib/utils";
export async function StudentDashboard({ctx}:{ctx:Ctx}) {
  const student=await db.student.findFirst({where:{userId:ctx.user.id,schoolId:ctx.schoolId,active:true},include:{class:true}});
  if(!student)return <Card><Empty title="No active student account"/></Card>;
  const list=await db.homework.findMany({where:{schoolId:ctx.schoolId,classId:student.classId,status:"ACTIVE",submissions:{none:{studentId:student.id,done:true}}},select:{id:true,title:true,dueOn:true,subject:{select:{name:true}}},orderBy:{dueOn:"asc"},take:10});
  return <><DashBanner title={`Welcome, ${student.name.split(" ")[0]}`} sub={ctx.user.school?.name} scene={<SceneLaptop/>} chips={<Chip>Class {student.class.name}</Chip>}/><Card title="Your homework" action={<Link href="/homework" className="text-sm text-brand-700">View all</Link>}>{list.length? <ul className="divide-y divide-slate-100">{list.map(h=><li key={h.id} className="py-4"><h3 className="font-semibold">{h.title}</h3><p className="text-sm text-slate-500">{h.subject.name} · Due {fmtDate(h.dueOn)}</p><HomeworkHelp id={h.id}/></li>)}</ul>:<p className="text-sm text-slate-500">No pending homework. Ask your assistant for study help or practice questions.</p>}</Card></>;
}
