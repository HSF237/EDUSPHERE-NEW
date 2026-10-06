import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { accessOf, isReadOnly } from "../billing";
import { AgentError, localDay, minutes, utcDay } from "./policy";
import type { Actor } from "./runtime";
const inputSchema=z.object({teacherId:z.string().min(1).max(128),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),kind:z.enum(["ABSENT","BLOCKED"]),startTime:z.string().max(5),endTime:z.string().max(5),reason:z.string().trim().max(500).optional()}).strict();
export async function saveAvailability(actor:Actor,input:unknown) {
  const parsed=inputSchema.safeParse(input);
  if (!parsed.success) throw new AgentError("Choose a teacher, date and valid availability type.");
  const data=parsed.data,date=utcDay(data.date);
  if (!Number.isFinite(+date)||date.toISOString().slice(0,10)!==data.date || data.date<localDay(new Date(),actor.timezone)) throw new AgentError("Choose today or a future date.");
  if (data.kind==="BLOCKED" && minutes(data.endTime)<=minutes(data.startTime)) throw new AgentError("The blocked period must end after it starts.");
  return db.$transaction(async tx=>{
    const user=await tx.user.findFirst({where:{id:actor.user.id,schoolId:actor.schoolId,role:"ADMIN",active:true},include:{school:true}});
    if (actor.support || !user?.school?.active || user.mustChangePassword || isReadOnly(accessOf(user.school).state)) throw new AgentError("Only a principal with an active school plan can change teacher availability.");
    const teacher=await tx.teacher.findFirst({where:{id:data.teacherId,schoolId:actor.schoolId,user:{active:true,schoolId:actor.schoolId}},select:{id:true}});
    if (!teacher) throw new AgentError("Teacher not found in your school.");
    const startTime=data.kind==="BLOCKED"?data.startTime:null,endTime=data.kind==="BLOCKED"?data.endTime:null;
    const existing=await tx.teacherAvailability.findFirst({where:{schoolId:actor.schoolId,teacherId:teacher.id,date,kind:data.kind,startTime}});
    if (existing) await tx.teacherAvailability.update({where:{id:existing.id},data:{endTime,reason:data.reason || null}});
    else await tx.teacherAvailability.create({data:{schoolId:actor.schoolId,teacherId:teacher.id,date,kind:data.kind,startTime,endTime,reason:data.reason || null}});
    await tx.auditLog.create({data:{schoolId:actor.schoolId,userId:actor.user.id,action:"AI_AVAILABILITY_SAVED",entity:teacher.id,detail:JSON.stringify({date:data.date,kind:data.kind,startTime,endTime})}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
export async function removeAvailability(actor:Actor,id:string) {
  if (!id || id.length>128) throw new AgentError("Invalid availability record.");
  return db.$transaction(async tx=>{
    const user=await tx.user.findFirst({where:{id:actor.user.id,schoolId:actor.schoolId,role:"ADMIN",active:true},include:{school:true}});
    if (actor.support || !user?.school?.active || user.mustChangePassword || isReadOnly(accessOf(user.school).state)) throw new AgentError("Only a principal with an active school plan can change teacher availability.");
    const row=await tx.teacherAvailability.findFirst({where:{id,schoolId:actor.schoolId}});
    if (!row) throw new AgentError("Availability record not found.");
    // An approved substitution keeps its absence record until the school resolves coverage explicitly.
    if (row.kind==="ABSENT" && await tx.substitute.count({where:{schoolId:actor.schoolId,absentTeacherId:row.teacherId,date:row.date}})) throw new AgentError("Approved substitutions exist for this absence. Resolve those assignments before removing it.");
    await tx.teacherAvailability.delete({where:{id:row.id}});
    await tx.auditLog.create({data:{schoolId:actor.schoolId,userId:actor.user.id,action:"AI_AVAILABILITY_REMOVED",entity:row.id}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
