import { db } from "@/lib/db";
import { localDay, utcDay } from "@/lib/ai/policy";
import { TeacherAvailability } from "./availability";
import { redirect } from "next/navigation";
import { getCtx } from "@/lib/scope";
import { PageHeader } from "@/components/ui";
import { configured } from "@/lib/ai/provider";
import { pendingPreviews } from "@/lib/ai/runtime";
import { copilotActor } from "./actions";
import { CopilotChat } from "./chat";
export const metadata={title:"EduSphere Copilot"};
export const dynamic="force-dynamic";
export default async function CopilotPage() {
  const ctx=await getCtx({allowLocked:true});
  if (ctx.role==="SUPER_ADMIN" || !ctx.schoolId || ctx.support || !ctx.user.school?.active) redirect("/dashboard");
  const actor=await copilotActor();
  const today=localDay(new Date(),actor.timezone);
  const [previews,teachers,records]=await Promise.all([
    pendingPreviews(actor),
    ctx.role==="ADMIN"?db.teacher.findMany({where:{schoolId:ctx.schoolId,user:{active:true,schoolId:ctx.schoolId}},select:{id:true,maxDailyPeriods:true,maxSubstitutePeriods:true,user:{select:{name:true}}},orderBy:{employeeNo:"asc"}}):[],
    ctx.role==="ADMIN"?db.teacherAvailability.findMany({where:{schoolId:ctx.schoolId,date:{gte:utcDay(today)}},select:{id:true,date:true,kind:true,startTime:true,endTime:true,teacher:{select:{user:{select:{name:true}}}}},orderBy:{date:"asc"},take:100}):[],
  ]);
  return <>
    <PageHeader title={ctx.role==="ADMIN"?"Principal Copilot":"EduSphere Copilot"} sub="Ask about your school. Review and approve proposed changes." />
    <CopilotChat ready={configured()} principal={ctx.role==="ADMIN"} readOnly={actor.readOnly} initialPreviews={previews} />
    {ctx.role==="ADMIN" && <TeacherAvailability today={today} readOnly={actor.readOnly} teachers={teachers.map(t=>({id:t.id,name:t.user.name,maxDailyPeriods:t.maxDailyPeriods,maxSubstitutePeriods:t.maxSubstitutePeriods}))} records={records.map(r=>({id:r.id,date:r.date.toISOString().slice(0,10),kind:r.kind,startTime:r.startTime,endTime:r.endTime,teacher:r.teacher.user.name}))} />}
  </>;
}
