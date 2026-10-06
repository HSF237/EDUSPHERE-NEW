import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { localDay, utcDay } from "@/lib/ai/policy";
import Link from "next/link";
export const metadata={title:"Teacher meetings"};
export default async function Meetings() {
  const ctx=await getCtx();
  if(!["ADMIN","TEACHER"].includes(ctx.role)||ctx.support)redirect("/dashboard");
  const [meetings,teachers,classes]=await Promise.all([
    db.schoolMeeting.findMany({where:{schoolId:ctx.schoolId,date:{gte:utcDay(localDay(new Date(),ctx.user.school?.timezone??"Asia/Kolkata"))},...(ctx.role==="TEACHER"?{teacherIds:{has:ctx.teacherId??"none"}}:{})},orderBy:[{date:"asc"},{startTime:"asc"}],take:100}),
    db.teacher.findMany({where:{schoolId:ctx.schoolId,user:{schoolId:ctx.schoolId}},select:{id:true,user:{select:{name:true}}}}),
    db.class.findMany({where:{schoolId:ctx.schoolId},select:{id:true,name:true}}),
  ]);
  return <><PageHeader title="Teacher meetings" sub="Approved staff meetings and class planning sessions.">{ctx.role==="ADMIN"&&<Link href="/copilot" className="btn">Plan with Copilot</Link>}</PageHeader>
    {!meetings.length&&<Card><Empty title="No upcoming teacher meetings" hint="Ask the principal to schedule a meeting through Copilot."/></Card>}
    <div className="space-y-4">{meetings.map(m=><Card key={m.id} title={m.title}><p className="text-sm font-semibold text-brand-700">{fmtDate(m.date)} · {m.startTime}–{m.endTime} · {ctx.user.school?.timezone??"Asia/Kolkata"}</p>{m.venue&&<p className="mt-2 text-sm">Venue: {m.venue}</p>}<p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.agenda}</p><p className="mt-3 text-xs text-slate-500">Classes: {m.classIds.map(id=>classes.find(c=>c.id===id)?.name??"Class unavailable").join(", ")||"School-wide"}</p><p className="mt-2 text-xs text-slate-500">Teachers: {m.teacherIds.map(id=>teachers.find(t=>t.id===id)?.user.name??"Teacher unavailable").join(", ")}</p></Card>)}</div></>;
}
