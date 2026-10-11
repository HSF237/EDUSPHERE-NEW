/**
 * Cost-free, deterministic commands for existing EduSphere tools.
 * This is not an LLM. Never interpret unknown requests as authorized writes.
 */
import { db } from "../db";
import { dispatch, type Actor } from "./runtime";
import type { AgentReply } from "./provider";

const dateExpression = /\b(today|tomorrow|\d{4}-\d{2}-\d{2})\b/i;
const teacherName = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function runQuickCommand(actor: Actor, message: string): Promise<AgentReply | null> {
  const request = message.trim();
  if (!request) return null;

  if (/^(?:show|give|check|get|what(?:'s| is))\b/i.test(request) && /\b(?:school status|today's school|school summary)\b/i.test(request)) {
    const phrase = request.match(dateExpression)?.[1] ?? "today";
    const result = await dispatch(actor, `Show school status on ${phrase}.`, {
      id: "quick-status", name: "get_school_status", arguments: { date: phrase }
    });
    const data = result.data as {date:string;absentTeachers?:string[];uncoveredPeriods?:number;pendingApprovals?:number;approvedAttendance?:unknown[]} | undefined;
    if (!data) return {text:"School status could not be retrieved."};
    return {text:[
      `School status for ${data.date}`,
      `Recorded absent teachers: ${data.absentTeachers?.length ? data.absentTeachers.join(", ") : "none recorded"}.`,
      `Approved class attendance registers: ${data.approvedAttendance?.length ?? 0}.`,
      `Uncovered timetable periods: ${data.uncoveredPeriods ?? 0}.`,
      `Pending AI approval plans: ${(data as {pendingAiApprovals?:number}).pendingAiApprovals ?? 0}.`,
      "This report includes only information currently recorded in EduSphere."
    ].join("\n"),observations:result.data ? [{tool:"get_school_status",data:result.data}]:[]};
  }

  if (/\b(?:available|free) teachers?\b/i.test(request) && /\bperiod\s+\d{1,2}\b/i.test(request)) {
    const p = request.match(/\bperiod\s+(\d{1,2})\b/i);
    const date = request.match(dateExpression)?.[1] ?? "today";
    if (!p) return null;
    const result = await dispatch(actor, `Find available teachers in period ${p[1]} on ${date}.`, {
      id:"quick-available",name:"get_available_teachers",arguments:{period:Number(p[1]),date}
    });
    const names=((result.data as {teachers?:{name:string}[]})?.teachers ?? []).map(t=>t.name);
    return {text:`Available teachers for period ${p[1]} on ${date}: ${names.length?names.join(", "):"none recorded as free"}. Availability is checked against the timetable; subject suitability must be checked before assignment.`};
  }

  if (/\b(?:my updates|today's updates|my homework updates)\b/i.test(request)) {
    const result = await dispatch(actor,request,{id:"quick-updates",name:"get_my_updates",arguments:{}});
    const data=result.data as {updates?:{text:string}[]} | undefined;
    return {text:data?.updates?.length ? data.updates.map(u=>u.text).join("\n\n") : "No new updates are recorded for your account today."};
  }

  // Principal-only existing approval-based substitute planning.
  // Resolve names against the authenticated school's teacher roster; never trust an arbitrary ID.
  if (actor.role==="ADMIN" && /\b(?:substitute|substitutes|substitution|cover|coverage)\b/i.test(request) && /\babsent\b/i.test(request)) {
    const date=request.match(dateExpression)?.[1];
    if (!date) return {text:"Please include today, tomorrow, or a YYYY-MM-DD date so I can prepare a safe substitute plan."};
    const teachers=await db.teacher.findMany({
      where:{schoolId:actor.schoolId,user:{schoolId:actor.schoolId,active:true}},
      select:{user:{select:{name:true}}},take:500
    });
    const matching=teachers.map(t=>t.user.name).filter(name=>new RegExp(`(?:^|\\W)${teacherName(name)}(?=\\W|$)`,"i").test(request));
    if(matching.length!==1) return {text:"Please name exactly one absent teacher using their registered full name. I couldn't identify a unique teacher in your school."};
    const name=matching[0];
    const canonical=`${name} is absent on ${date}. Prepare suitable substitute coverage.`;
    const result=await dispatch(actor,canonical,{id:"quick-substitution",name:"plan_substitute_coverage",arguments:{teacher_name:name,date}});
    return result.approval ? {text:"I prepared a substitution plan using live school records. Review every assignment before approval.",approval:result.approval} : {text:JSON.stringify(result.data ?? {message:"No new coverage needed."})};
  }
  return null;
}
