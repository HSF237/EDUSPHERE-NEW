import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {PrismaPGlite} from "pglite-prisma-adapter";
import {PrismaClient} from "@prisma/client";
import {localDay,utcDay,AgentError} from "../src/lib/ai/policy";
import {parseAttendanceCommand} from "../src/lib/ai/attendance-command";
import type {Actor} from "../src/lib/ai/runtime";

test("Natural-language attendance parser rejects ambiguous and conflicting input",()=>{
  assert.deepEqual(parseAttendanceCommand("Mark roll 5 and 17 absent and roll 9 late today"),{date:"today",absent:[5,17],late:[9]});
  assert.deepEqual(parseAttendanceCommand("Mark roll numbers 1, 2, and 3 absent, roll 4 late today"),{date:"today",absent:[1,2,3],late:[4]});
  assert.equal(parseAttendanceCommand("Mark roll 5 absent and roll 5 late today"),null);
  assert.equal(parseAttendanceCommand("Mark Sam absent today"),null);
  assert.equal(parseAttendanceCommand("Mark roll 5 absent"),null);
});

test("Teacher attendance previews and confirmations are scoped, reviewed and atomic",async t=>{
  const pg=new PGlite();
  await pg.waitReady;
  const dirs=(await readdir("prisma/migrations",{withFileTypes:true})).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name));
  for(const dir of dirs) await pg.exec(await readFile("prisma/migrations/"+dir.name+"/migration.sql","utf8"));
  const db=new PrismaClient({adapter:new PrismaPGlite(pg)});
  (globalThis as unknown as {prisma:PrismaClient}).prisma=db;
  const {dispatch,confirmProposal}=await import("../src/lib/ai/runtime");
  const fixture=async()=>{
    const id=crypto.randomUUID();
    const school=await db.school.create({data:{name:"Attendance school",code:id,comped:true}});
    const user=await db.user.create({data:{schoolId:school.id,name:"Class teacher",email:id+"@example.test",passwordHash:"fixture",role:"TEACHER"}});
    const teacher=await db.teacher.create({data:{schoolId:school.id,userId:user.id,employeeNo:"T-1"}});
    const year=await db.academicYear.create({data:{schoolId:school.id,name:"2026–27",startsOn:utcDay("2026-04-01"),endsOn:utcDay("2027-03-31"),current:true}});
    const klass=await db.class.create({data:{schoolId:school.id,yearId:year.id,name:"8A",grade:8,section:"A",classTeacherId:teacher.id}});
    for(const no of [5,9,17,20]) await db.student.create({data:{schoolId:school.id,classId:klass.id,name:"Student "+no,admissionNo:"A"+no,rollNo:no,gender:"X"}});
    const actor:Actor={role:"TEACHER",schoolId:school.id,classIds:[klass.id],childIds:[],teacherId:teacher.id,perms:[],support:false,user:{id:user.id,mustChangePassword:false},readOnly:false,timezone:school.timezone};
    const date=localDay(new Date(),school.timezone);
    const command="Mark roll 5 and 17 absent and roll 9 late today";
    const call={id:"attendance",name:"mark_attendance",arguments:{date:"today",absentStudentRollNumbers:[5,17],lateStudentRollNumbers:[9]}};
    return {school,user,teacher,klass,actor,date,command,call};
  };
  try {
    await t.test("only a teacher confirmation writes all roster records as pending",async()=>{
      const f=await fixture();
      const result=await dispatch(f.actor,f.command,f.call);
      assert.ok(result.approval);
      assert.equal(await db.attendanceSession.count({where:{schoolId:f.school.id}}),0);
      const saved=await confirmProposal(f.actor,result.approval!.id,result.approval!.fingerprint);
      assert.ok(saved && typeof saved==="object" && !Array.isArray(saved));
      assert.equal((saved as {kind?:string}).kind,"attendance_submitted");
      const ses=await db.attendanceSession.findFirstOrThrow({where:{schoolId:f.school.id,classId:f.klass.id},include:{records:{include:{student:true}}}});
      assert.equal(ses.status,"PENDING");
      assert.deepEqual(Object.fromEntries(ses.records.map(x=>[x.student.rollNo,x.status])),{5:"ABSENT",9:"LATE",17:"ABSENT",20:"PRESENT"});
      await confirmProposal(f.actor,result.approval!.id,result.approval!.fingerprint);
      assert.equal(await db.attendanceSession.count({where:{schoolId:f.school.id}}),1);
    });
    await t.test("cannot approve another school's preview or grant principal rights to a student",async()=>{
      const a=await fixture(),b=await fixture();
      const preview=(await dispatch(a.actor,a.command,a.call)).approval!;
      await assert.rejects(()=>confirmProposal(b.actor,preview.id,preview.fingerprint),AgentError);
      await assert.rejects(()=>dispatch({...a.actor,role:"PARENT"},a.command,a.call),AgentError);
      assert.equal(await db.attendanceSession.count({where:{schoolId:a.school.id}}),0);
    });
    await t.test("changed class roster invalidates the preview",async()=>{
      const f=await fixture(),preview=(await dispatch(f.actor,f.command,f.call)).approval!;
      await db.student.create({data:{schoolId:f.school.id,classId:f.klass.id,name:"New learner",admissionNo:"A21",rollNo:21,gender:"X"}});
      await assert.rejects(()=>confirmProposal(f.actor,preview.id,preview.fingerprint),AgentError);
      assert.equal(await db.attendanceSession.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("model cannot add roll numbers not present in the teacher's request",async()=>{
      const f=await fixture();
      await assert.rejects(()=>dispatch(f.actor,f.command,{...f.call,arguments:{date:"today",absentStudentRollNumbers:[5,17,20],lateStudentRollNumbers:[9]}}),AgentError);
    });
  } finally {await db.$disconnect();await pg.close();}
});
