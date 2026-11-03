import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AgentError, exactDate, hash, localDay, utcDay } from "./policy";
import { parseAttendanceCommand } from "./attendance-command";
import type { Actor } from "./runtime";

type Tx = Prisma.TransactionClient;
const rolls=z.array(z.number().int().min(1).max(10000)).max(100);
const argsSchema=z.object({date:z.string(),absentStudentRollNumbers:rolls,lateStudentRollNumbers:rolls}).strict();
const payloadSchema=z.object({
  classId:z.string(),className:z.string(),date:z.string(),
  absentRollNumbers:rolls,lateRollNumbers:rolls,registeredStudents:z.number().int()
}).strict();

function same(a:number[],b:number[]) {
  return [...a].sort((x,y)=>x-y).join(",")===[...b].sort((x,y)=>x-y).join(",");
}

/** Rebuild from authoritative school membership, never from a model's class ID. */
async function registerSnapshot(tx:Tx, actor:Actor, classId:string, date:string) {
  if(actor.role!=="TEACHER" || actor.readOnly || !actor.teacherId || !actor.classIds.includes(classId)) {
    throw new AgentError("Only an active class teacher can prepare attendance for their selected class.");
  }
  const klass=await tx.class.findFirst({
    where:{id:classId,schoolId:actor.schoolId,classTeacherId:actor.teacherId,year:{current:true}},
    select:{id:true,name:true}
  });
  if(!klass) throw new AgentError("Switch to the class you are assigned to before marking attendance.");
  const students=await tx.student.findMany({
    where:{schoolId:actor.schoolId,classId:klass.id,active:true},
    select:{id:true,rollNo:true,name:true},orderBy:[{rollNo:"asc"},{id:"asc"}],take:151
  });
  if(!students.length || students.length>150) throw new AgentError("This class needs a valid roster with at most 150 active students.");
  if(new Set(students.map(s=>s.rollNo)).size!==students.length) throw new AgentError("Student roll numbers must be unique within the class before using AI attendance.");
  const previous=await tx.attendanceSession.findFirst({
    where:{schoolId:actor.schoolId,classId,date:utcDay(date)},
    select:{id:true,status:true,markedById:true,reviewNote:true,records:{select:{studentId:true,status:true,note:true},orderBy:{studentId:"asc"}}}
  });
  if(previous?.status==="APPROVED") throw new AgentError("This register is already approved and locked. Ask the principal to return it for correction.");
  return {className:klass.name,students,snapshotHash:hash({schoolId:actor.schoolId,classId,date,students,previous})};
}

export async function prepareTeacherAttendance(tx:Tx,actor:Actor,request:string,args:unknown) {
  const p=argsSchema.safeParse(args);
  if(!p.success) throw new AgentError("The attendance request has invalid roll numbers.");
  const spoken=parseAttendanceCommand(request);
  if(!spoken) throw new AgentError("Use a precise command such as: Mark roll 5 and 17 absent and roll 9 late today.");
  if(!same(spoken.absent,p.data.absentStudentRollNumbers)||!same(spoken.late,p.data.lateStudentRollNumbers)) {
    throw new AgentError("The AI changed the roll numbers. Please repeat your exact attendance command.");
  }
  const day=exactDate(request,p.data.date,actor.timezone);
  if(day!==exactDate(request,spoken.date,actor.timezone)) throw new AgentError("The date does not match your request.");
  if(day>localDay(new Date(),actor.timezone)) throw new AgentError("You cannot submit attendance for a future date.");
  const classId=actor.classIds[0];
  if(!classId) throw new AgentError("Select your class teacher workspace first.");
  const snap=await registerSnapshot(tx,actor,classId,day);
  const registered=new Set(snap.students.map(s=>s.rollNo));
  if([...spoken.absent,...spoken.late].some(n=>!registered.has(n))) {
    throw new AgentError("One or more roll numbers are not present in the selected class. No attendance was changed.");
  }
  const payload={
    classId,className:snap.className,date:day,
    absentRollNumbers:spoken.absent,lateRollNumbers:spoken.late,registeredStudents:snap.students.length
  };
  return {payload:payload as Prisma.InputJsonObject,snapshotHash:snap.snapshotHash};
}

export async function confirmTeacherAttendance(tx:Tx,actor:Actor,unsafePayload:unknown,expectedHash:string):Promise<Prisma.InputJsonObject> {
  const parsed=payloadSchema.safeParse(unsafePayload);
  if(!parsed.success) throw new AgentError("The attendance preview has invalid information.");
  const p=parsed.data;
  const snap=await registerSnapshot(tx,actor,p.classId,p.date);
  if(snap.snapshotHash!==expectedHash || snap.students.length!==p.registeredStudents) {
    throw new AgentError("The register or class roster changed after this preview. Prepare a new one.");
  }
  const absent=new Set(p.absentRollNumbers), late=new Set(p.lateRollNumbers);
  if([...absent,...late].length!==p.absentRollNumbers.length+p.lateRollNumbers.length ||
     [...absent].some(n=>late.has(n)) ||
     [...absent,...late].some(n=>!snap.students.some(s=>s.rollNo===n))) {
    throw new AgentError("The attendance preview contains conflicting or unknown roll numbers.");
  }
  const day=utcDay(p.date);
  const ses=await tx.attendanceSession.upsert({
    where:{classId_date:{classId:p.classId,date:day}},
    create:{schoolId:actor.schoolId,classId:p.classId,date:day,markedById:actor.user.id,status:"PENDING"},
    update:{markedById:actor.user.id,status:"PENDING",reviewedById:null,reviewNote:null}
  });
  await tx.attendanceRecord.deleteMany({where:{sessionId:ses.id}});
  await tx.attendanceRecord.createMany({data:snap.students.map(s=>({
    sessionId:ses.id,studentId:s.id,status:absent.has(s.rollNo)?"ABSENT" as const:late.has(s.rollNo)?"LATE" as const:"PRESENT" as const
  }))});
  return {kind:"attendance_submitted",className:p.className,date:p.date,registeredStudents:snap.students.length,absent:p.absentRollNumbers.length,late:p.lateRollNumbers.length,approvalStatus:"PENDING"};
}
