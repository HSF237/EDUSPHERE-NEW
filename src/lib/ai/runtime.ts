import { Prisma } from "@prisma/client";
import { db } from "../db";
import { accessOf, isReadOnly } from "../billing";
import type { Ctx } from "../scope";
import { AgentError, exactAbsence, exactClass, exactClasses, exactDate, exactTeacher, exactYear, hash, localDay, utcDay } from "./policy";
import { isFree, planCoverage, type PlanningData, type Assignment } from "./planner";
import { TOOLS, toolByName, validateCall, type Tool } from "./tools";
import type { Approval, FunctionCall } from "./provider";
import { personalUpdates, scopedHomework } from "./updates";
import { applySchoolPlan, buildSchoolPlan, schoolSnapshot, searchSchoolRecords } from "./school";

type Tx = Prisma.TransactionClient;
export type Actor = Pick<Ctx,"role"|"schoolId"|"classIds"|"childIds"|"teacherId"|"perms"|"support"> & {user:{id:string;mustChangePassword:boolean};timezone:string;readOnly:boolean};
export function assertActor(actor:Actor) {
  if (!actor.schoolId || actor.support || actor.role==="SUPER_ADMIN" || actor.user.mustChangePassword) throw new AgentError("Copilot requires an active school account outside support mode.");
}
export function mayUse(actor:Actor,tool:Tool) {
  if (!tool.enabled || !tool.allowedRoles.includes(actor.role)) return false;
  if (!tool.readOnly) return actor.role==="ADMIN" && !actor.readOnly;
  if (tool.name==="get_attendance") return actor.role==="ADMIN" || actor.role==="TEACHER";
  if (tool.capability==="REPORTS") return actor.role==="ADMIN" || (actor.role==="TEACHER" && actor.perms.includes("REPORTS"));
  if (tool.capability==="SUBSTITUTES") return actor.role==="ADMIN" || (actor.role==="TEACHER" && (actor.perms.includes("SUBSTITUTES") || tool.name==="get_teacher_timetable"));
  return true;
}
export function declarations(actor:Actor) {
  assertActor(actor);
  return TOOLS.filter(t=>mayUse(actor,t)).map(t=>({type:"function",name:t.name,description:t.description,parameters:t.parameters}));
}
async function retryTransaction<T>(fn:(tx:Tx)=>Promise<T>):Promise<T> {
  for (let n=0;n<3;n++) {
    try {return await db.$transaction(fn,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:30000});}
    catch (e) {if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code!=="P2034" || n===2) throw e;}
  }
  throw new AgentError("Data changed concurrently. Please try again.");
}
async function fresh(tx:Tx,actor:Actor,write=false) {
  assertActor(actor);
  const u=await tx.user.findFirst({where:{id:actor.user.id,schoolId:actor.schoolId,active:true},include:{school:true,teacher:true}});
  if (!u?.school?.active || u.mustChangePassword || u.role!==actor.role) throw new AgentError("Your account or permissions changed. Sign in again.");
  if (u.role === "STUDENT" && !(await tx.student.findFirst({where:{userId:u.id,schoolId:actor.schoolId,active:true,class:{schoolId:actor.schoolId}},select:{id:true}}))) throw new AgentError("Your student account is no longer active.");
  const updated={...actor,perms:u.teacher?.permissions ?? [],timezone:u.school.timezone,teacherId:u.teacher?.id ?? null,readOnly:isReadOnly(accessOf(u.school).state)};
  if (write && (u.role!=="ADMIN" || updated.readOnly)) throw new AgentError("Only a principal with an active school plan can confirm these changes.");
  return updated;
}
async function audit(tx:Tx,actor:Actor,action:string,entity:string,detail:unknown) {
  await tx.auditLog.create({data:{schoolId:actor.schoolId,userId:actor.user.id,action:`AI_${action}`,entity,detail:JSON.stringify(detail)}});
}
async function currentYear(tx:Tx,schoolId:string) {
  const years=await tx.academicYear.findMany({where:{schoolId,current:true},select:{id:true,name:true,startsOn:true,endsOn:true},orderBy:{id:"asc"}});
  if (years.length!==1) throw new AgentError("Set exactly one current academic year before using school actions.");
  return years[0];
}
async function resolveTeacher(tx:Tx,actor:Actor,request:string,name:string) {
  exactTeacher(request,name);
  const teachers=await tx.teacher.findMany({where:{schoolId:actor.schoolId,user:{name,active:true,schoolId:actor.schoolId}},select:{id:true,userId:true,user:{select:{name:true}}},take:2});
  if (teachers.length!==1) throw new AgentError("The teacher name is missing or matches multiple people. Use their unique exact name.");
  return teachers[0];
}
async function resolveClass(tx:Tx,actor:Actor,request:string,name:string) {
  exactClass(request,name);
  const rows=await tx.class.findMany({where:{schoolId:actor.schoolId,name,year:{current:true}},select:{id:true,name:true},take:2});
  if (rows.length!==1) throw new AgentError("The class is missing or ambiguous in the current school year.");
  if (actor.role!=="ADMIN" && !actor.classIds.includes(rows[0].id)) throw new AgentError("That class is outside your authorized workspace or children’s classes.");
  if (actor.role==="TEACHER") {
    const scoped=await tx.class.findFirst({where:{id:rows[0].id,schoolId:actor.schoolId,OR:[{classTeacherId:actor.teacherId ?? "none"},{subjects:{some:{teacherId:actor.teacherId ?? "none"}}}]},select:{id:true}});
    if (!scoped) throw new AgentError("Your teacher assignment changed. Refresh your workspace.");
  }
  if (actor.role==="PARENT") {
    const scoped=await tx.guardian.findFirst({where:{userId:actor.user.id,student:{schoolId:actor.schoolId,classId:rows[0].id,active:true}},select:{id:true}});
    if (!scoped) throw new AgentError("You do not have a child in that class.");
  }
  // Parent class scope is not sufficient for student-level records: this module exposes timetable only.
  return rows[0];
}
async function classSnapshot(tx:Tx,actor:Actor) {
  const year=await currentYear(tx,actor.schoolId);
  const classes=await tx.class.findMany({where:{schoolId:actor.schoolId,yearId:year.id},select:{id:true,name:true,grade:true,section:true},orderBy:{id:"asc"}});
  return {year,classes};
}
async function planningSnapshot(tx:Tx,actor:Actor,day:string) {
  const year=await currentYear(tx,actor.schoolId), dayIndex=(utcDay(day).getUTCDay()+6)%7;
  const [slots,teachers,availability,existing]=await Promise.all([
    tx.timetableSlot.findMany({where:{schoolId:actor.schoolId,day:dayIndex,class:{schoolId:actor.schoolId,yearId:year.id}},select:{id:true,teacherId:true,classId:true,subjectId:true,period:true,startTime:true,endTime:true,class:{select:{name:true}},subject:{select:{name:true,schoolId:true}}},orderBy:{id:"asc"}}),
    tx.teacher.findMany({where:{schoolId:actor.schoolId,user:{active:true,schoolId:actor.schoolId}},select:{id:true,userId:true,maxSubstitutePeriods:true,maxDailyPeriods:true,user:{select:{name:true}},assignments:{where:{class:{schoolId:actor.schoolId,yearId:year.id},subject:{schoolId:actor.schoolId}},select:{subjectId:true},orderBy:{subjectId:"asc"}}},orderBy:{id:"asc"}}),
    tx.teacherAvailability.findMany({where:{schoolId:actor.schoolId,date:utcDay(day)},select:{id:true,teacherId:true,kind:true,startTime:true,endTime:true},orderBy:{id:"asc"}}),
    tx.substitute.findMany({where:{schoolId:actor.schoolId,date:utcDay(day),slot:{class:{schoolId:actor.schoolId,yearId:year.id}}},select:{id:true,slotId:true,subTeacherId:true,absentTeacherId:true},orderBy:{id:"asc"}}),
  ]);
  if (slots.length>5000 || teachers.length>1000) throw new AgentError("The timetable is too large for this planner. Please contact the administrator.");
  if (slots.some(s=>s.subject.schoolId!==actor.schoolId || !teachers.some(t=>t.id===s.teacherId))) throw new AgentError("The timetable includes inactive or invalid teachers. Fix those records before planning.");
  const data:PlanningData={slots:slots.map(s=>({...s,className:s.class.name,subjectName:s.subject.name})),teachers:teachers.map(t=>({...t,name:t.user.name,subjectIds:t.assignments.map(a=>a.subjectId)})),availability:[...availability,...existing.map(e=>({teacherId:e.absentTeacherId,kind:"ABSENT",startTime:null,endTime:null}))],existing};
  return {year,data,snapshotHash:hash({year,slots,teachers,availability,existing})};
}
export async function reserveBudget(actor:Actor) {
  const day=utcDay(localDay(new Date(),actor.timezone));
  const positive=(key:string,fallback:number) => {const n=Number(process.env[key]);return Number.isSafeInteger(n)&&n>0?n:fallback;};
  await retryTransaction(async tx=>{
    await fresh(tx,actor);
    for (const [userId,max] of [["*",positive("AI_SCHOOL_DAILY_REQUESTS",200)],[actor.user.id,positive("AI_USER_DAILY_REQUESTS",20)]] as const) {
      const usage=await tx.aiUsage.upsert({where:{schoolId_userId_day:{schoolId:actor.schoolId,userId,day}},create:{schoolId:actor.schoolId,userId,day,requests:1},update:{requests:{increment:1}}});
      if (usage.requests>max) throw new AgentError("EduSphere’s daily AI request budget was reached. Please try tomorrow.");
    }
    await audit(tx,actor,"REQUEST","Copilot",{day:day.toISOString().slice(0,10)});
  });
}
function preview(p:{id:string;fingerprint:string;tool:string;expiresAt:Date;status:string;payload:Prisma.JsonValue}):Approval {
  return {id:p.id,fingerprint:p.fingerprint,tool:p.tool,expiresAt:p.expiresAt.toISOString(),status:p.status,changes:p.payload as Record<string,unknown>};
}
export async function pendingPreviews(actor:Actor):Promise<Approval[]> {
  assertActor(actor);
  return (await db.aiProposal.findMany({where:{schoolId:actor.schoolId,userId:actor.user.id,status:"PENDING",expiresAt:{gt:new Date()}},orderBy:{createdAt:"desc"},take:10})).map(preview);
}
async function prepare(tx:Tx,actor:Actor,tool:string,payload:Prisma.InputJsonObject,snapshotHash:string) {
  const fingerprint=hash({schoolId:actor.schoolId,userId:actor.user.id,tool,payload,snapshotHash});
  const p=await tx.aiProposal.create({data:{schoolId:actor.schoolId,userId:actor.user.id,tool,payload,snapshotHash,fingerprint,expiresAt:new Date(Date.now()+10*60000)}});
  await audit(tx,actor,"PROPOSED",p.id,{tool,fingerprint});
  return {approval:preview(p)};
}
export async function dispatch(actor:Actor,request:string,call:FunctionCall):Promise<{approval?:Approval;data?:unknown}> {
  const tool=toolByName(call.name);
  const args=validateCall(call.name,call.arguments);
  return retryTransaction(async tx=>{
    const current=await fresh(tx,actor,!tool.readOnly);
    if (!mayUse(current,tool)) throw new AgentError("You do not have permission for that action.");
    if(call.name==="search_school_records") {
      const data=await searchSchoolRecords(tx,current,args);
      await audit(tx,current,"READ",call.name,{resource:args.resource,resultHash:hash(data)});
      return {data};
    }
    if(call.name==="prepare_school_actions") {
      const snapshot=await schoolSnapshot(tx,current.schoolId);
      const plan=buildSchoolPlan(snapshot,args,current);
      return prepare(tx,current,call.name,JSON.parse(JSON.stringify(plan)) as Prisma.InputJsonObject,hash(snapshot));
    }
    if (call.name==="create_classes") {
      const codes=args.class_codes as string[];
      exactClasses(request,codes);
      const snap=await classSnapshot(tx,current);
      const yearName=exactYear(request,args.academic_year as string,snap.year.name);
      if (codes.some(code=>snap.classes.some(c=>c.name===code))) throw new AgentError("One or more divisions already exist. No duplicate classes will be created.");
      return prepare(tx,current,call.name,{classCodes:[...codes].sort(),yearId:snap.year.id,academicYear:yearName},hash(snap));
    }
    if (call.name === "get_my_updates" || call.name === "get_homework") {
      const data = call.name === "get_my_updates" ? await personalUpdates(tx,current) : await scopedHomework(tx,current,String(args.homework_id));
      await audit(tx,current,"READ",call.name,{resultHash:hash(data)});
      return {data};
    }
    const day=exactDate(request,args.date as string,current.timezone);
    let data:unknown;
    if (call.name==="plan_substitute_coverage" || call.name==="get_teacher_timetable") {
      const t=await resolveTeacher(tx,current,request,args.teacher_name as string);
      if (call.name==="get_teacher_timetable" && current.role==="TEACHER" && !current.perms.includes("SUBSTITUTES") && t.id!==current.teacherId) throw new AgentError("You can only query your own teacher timetable.");
      const snap=await planningSnapshot(tx,current,day);
      if (call.name==="plan_substitute_coverage") {
        exactAbsence(request,args.teacher_name as string);
        if (day<localDay(new Date(),current.timezone)) throw new AgentError("Substitutions cannot be assigned in the past.");
        if (!snap.data.slots.some(s=>s.teacherId===t.id)) throw new AgentError("This teacher has no timetable periods on that date.");
        const plan=planCoverage(snap.data,t.id);
        if (plan.gaps.length) return {data:{kind:"coverage_incomplete",date:day,uncovered:plan.gaps,message:"No approval is available until every affected period can be safely covered. Add qualified staff or adjust availability."}};
        if (!plan.assignments.length) return {data:{date:day,message:"All affected periods already have substitutions."}};
        return prepare(tx,current,call.name,{date:day,absentTeacherId:t.id,absentTeacherName:t.user.name,assignments:plan.assignments as unknown as Prisma.InputJsonArray,markAbsent:true,notifyTeachers:false},snap.snapshotHash);
      }
      data={date:day,teacher:t.user.name,periods:snap.data.slots.filter(s=>s.teacherId===t.id).map(s=>({class:s.className,subject:s.subjectName,period:s.period,startTime:s.startTime,endTime:s.endTime,substitute:snap.data.existing.find(e=>e.slotId===s.id)?.subTeacherId ?? null}))};
    } else if (call.name==="get_available_teachers") {
      const periods=[...request.matchAll(/\bPeriod\s+(\d+)\b/gi)].map(m=>Number(m[1]));
      if (!periods.length || periods.some(p=>p!==args.period)) throw new AgentError("Please state the exact period number.");
      const snap=await planningSnapshot(tx,current,day);
      const intervals=snap.data.slots.filter(s=>s.period===args.period);
      if (!intervals.length) throw new AgentError("No timetable interval is defined for that period/date.");
      if (new Set(intervals.map(i=>`${i.startTime}-${i.endTime}`)).size!==1) throw new AgentError("That period has different times across classes. Use a teacher-specific substitution request.");
      data={date:day,period:args.period,teachers:snap.data.teachers.filter(t=>isFree(snap.data,t,intervals[0])).map(t=>({name:t.name}))};
    } else if (call.name==="get_attendance" || call.name==="get_class_timetable") {
      const cls=await resolveClass(tx,current,request,args.class_code as string);
      if (call.name==="get_attendance") {
        const sessions=await tx.attendanceSession.findMany({where:{schoolId:current.schoolId,classId:cls.id,date:utcDay(day),status:"APPROVED"},select:{records:{select:{status:true}}}});
        data={class:cls.name,date:day,recorded:sessions.length>0,counts:sessions.flatMap(s=>s.records).reduce<Record<string,number>>((a,r)=>({...a,[r.status]:(a[r.status]??0)+1}),{})};
      } else {
        const slots=await tx.timetableSlot.findMany({where:{schoolId:current.schoolId,classId:cls.id,day:(utcDay(day).getUTCDay()+6)%7},select:{period:true,startTime:true,endTime:true,subject:{select:{name:true}},teacher:{select:{user:{select:{name:true}}}},subs:{where:{schoolId:current.schoolId,date:utcDay(day)},select:{sub:{select:{user:{select:{name:true}}}}}}},orderBy:{period:"asc"}});
        data={class:cls.name,date:day,periods:slots.map(s=>({period:s.period,startTime:s.startTime,endTime:s.endTime,subject:s.subject.name,teacher:s.subs[0]?.sub.user.name ?? s.teacher.user.name}))};
      }
    } else if (call.name==="get_school_status") {
      const [sessions,absences,pending,slots,subs]=await Promise.all([
        tx.attendanceSession.findMany({where:{schoolId:current.schoolId,date:utcDay(day),status:"APPROVED",class:{year:{current:true}}},select:{class:{select:{name:true}},records:{select:{status:true}}}}),
        tx.teacherAvailability.findMany({where:{schoolId:current.schoolId,date:utcDay(day),kind:"ABSENT"},select:{teacherId:true,teacher:{select:{user:{select:{name:true}}}}}}),
        tx.aiProposal.count({where:{schoolId:current.schoolId,status:"PENDING",expiresAt:{gt:new Date()}}}),
        tx.timetableSlot.findMany({where:{schoolId:current.schoolId,day:(utcDay(day).getUTCDay()+6)%7,class:{year:{current:true}}},select:{id:true,teacherId:true}}),
        tx.substitute.findMany({where:{schoolId:current.schoolId,date:utcDay(day)},select:{slotId:true,absentTeacherId:true}}),
      ]);
      const absentIds=new Set([...absences.map(a=>a.teacherId),...subs.map(s=>s.absentTeacherId)]),covered=new Set(subs.map(s=>s.slotId));
      data={date:day,approvedAttendance:sessions.map(s=>({class:s.class.name,total:s.records.length,present:s.records.filter(r=>r.status==="PRESENT"||r.status==="LATE").length})),absentTeachers:absences.map(a=>a.teacher.user.name),absentTeacherCount:absentIds.size,uncoveredPeriods:slots.filter(s=>absentIds.has(s.teacherId)&&!covered.has(s.id)).length,pendingAiApprovals:pending,unavailableMetrics:["exam-duty schedule unless entered as blocked availability","parent complaints","teacher leave outside availability records"]};
    } else throw new AgentError("Tool handler is unavailable.");
    await audit(tx,current,"READ",call.name,{date:day,resultHash:hash(data)});
    return {data};
  });
}
export async function confirmProposal(actor:Actor,id:string,fingerprint:string) {
  return retryTransaction(async tx=>{
    const current=await fresh(tx,actor,true);
    const p=await tx.aiProposal.findFirst({where:{id,schoolId:current.schoolId,userId:current.user.id}});
    if (!p || p.fingerprint!==fingerprint) throw new AgentError("The approval is missing or its preview changed.");
    const tool=toolByName(p.tool);
    if (!mayUse(current,tool)) throw new AgentError("You no longer have permission for this action.");
    if (p.status==="EXECUTED") return p.result;
    if (p.status!=="PENDING" || p.expiresAt<=new Date()) throw new AgentError("This preview was cancelled or expired. Prepare a new one.");
    const payload=p.payload as Record<string,Prisma.JsonValue>;
    if (hash({schoolId:p.schoolId,userId:p.userId,tool:p.tool,payload:p.payload,snapshotHash:p.snapshotHash})!==p.fingerprint) throw new AgentError("The stored preview failed validation.");
    let result:Prisma.InputJsonObject;
    if (p.tool==="create_classes") {
      const snap=await classSnapshot(tx,current);
      if (hash(snap)!==p.snapshotHash) throw new AgentError("Classes or the academic year changed. Prepare a new preview.");
      const codes=zCodes(payload.classCodes);
      if (payload.yearId!==snap.year.id || payload.academicYear!==snap.year.name) throw new AgentError("Academic year changed.");
      await tx.class.createMany({data:codes.map(code=>({schoolId:current.schoolId,yearId:snap.year.id,grade:Number(code.match(/^\d+/)![0]),section:code.replace(/^\d+/,""),name:code}))});
      result={kind:"executed",createdClasses:codes,academicYear:snap.year.name};
    } else if (p.tool==="plan_substitute_coverage") {
      const day=String(payload.date),snap=await planningSnapshot(tx,current,day);
      if (day<localDay(new Date(),current.timezone) || snap.snapshotHash!==p.snapshotHash) throw new AgentError("Timetable or availability changed. Prepare a new preview.");
      const absent=String(payload.absentTeacherId),plan=planCoverage(snap.data,absent);
      if (plan.gaps.length || hash(plan.assignments)!==hash(payload.assignments)) throw new AgentError("The proposed plan is no longer valid. Prepare a new one.");
      if (!await tx.teacherAvailability.findFirst({where:{schoolId:current.schoolId,teacherId:absent,date:utcDay(day),kind:"ABSENT"}})) await tx.teacherAvailability.create({data:{schoolId:current.schoolId,teacherId:absent,date:utcDay(day),kind:"ABSENT"}});
      await tx.substitute.createMany({data:plan.assignments.map(a=>({schoolId:current.schoolId,slotId:a.slotId,date:utcDay(day),absentTeacherId:absent,subTeacherId:a.subTeacherId,reason:"Principal-approved EduSphere Copilot plan"}))});
      // Notification delivery is a separate opt-in workflow, never silently sent here.
      result={kind:"executed",assignedPeriods:plan.assignments.length,date:day,notificationsSent:false};
    } else if(p.tool==="prepare_school_actions") {
      const snapshot=await schoolSnapshot(tx,current.schoolId);
      if(hash(snapshot)!==p.snapshotHash)throw new AgentError("School records changed after this preview. Prepare a new preview before approving.");
      const plan=buildSchoolPlan(snapshot,{summary:payload.summary,actions:payload.actions},current);
      if(hash(plan)!==hash(p.payload))throw new AgentError("The planned changes no longer match this approval. Prepare a new preview.");
      result=await applySchoolPlan(tx,current,plan);
    } else throw new AgentError("This action cannot be confirmed.");
    await tx.aiProposal.update({where:{id:p.id},data:{status:"EXECUTED",executedAt:new Date(),result}});
    // Private invitation/reset URLs belong only in the principal's action result, never audit logs.
    await audit(tx,current,"EXECUTED",p.id,{tool:p.tool,fingerprint:p.fingerprint,result:p.tool==="prepare_school_actions"?{kind:"executed",completedActions:result.completedActions}:result});
    return result;
  });
}
function zCodes(value:Prisma.JsonValue) {
  const parsed=toolByName("create_classes").schema.parse({class_codes:value,academic_year:"active"});
  return parsed.class_codes as string[];
}
export async function cancelProposal(actor:Actor,id:string) {
  return retryTransaction(async tx=>{
    const current=await fresh(tx,actor);
    const p=await tx.aiProposal.findFirst({where:{id,schoolId:current.schoolId,userId:current.user.id}});
    if (!p || p.status==="EXECUTED") throw new AgentError("That proposal is missing or already executed.");
    await tx.aiProposal.update({where:{id},data:{status:"CANCELLED"}});
    await audit(tx,current,"CANCELLED",id,{tool:p.tool});
    return {kind:"cancelled"};
  });
}
