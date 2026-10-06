import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {PrismaPGlite} from "pglite-prisma-adapter";
import {PrismaClient} from "@prisma/client";
import {personalUpdates,scopedHomework} from "../src/lib/ai/updates";
import {AgentError,localDay,utcDay} from "../src/lib/ai/policy";
import type {Actor} from "../src/lib/ai/runtime";
import {studentPageAllowed} from "../src/lib/student-access";
import {navFor} from "../src/components/nav";

test("Student routes and navigation exclude staff tools",()=>{
  assert.deepEqual(navFor("STUDENT",null,[]).map(n=>n.href),["/dashboard","/copilot","/homework","/notifications","/settings"]);
  for(const path of ["/students","/messages","/billing","/homework/other","/owner","/teachers"])assert.equal(studentPageAllowed(path),false);
  assert.equal(studentPageAllowed("/homework"),true);
});

test("Personal assistant and student accounts",async t=>{
  const pg=new PGlite();await pg.waitReady;
  for(const d of (await readdir("prisma/migrations",{withFileTypes:true})).filter(d=>d.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name)))await pg.exec(await readFile(`prisma/migrations/${d.name}/migration.sql`,"utf8"));
  const db=new PrismaClient({adapter:new PrismaPGlite(pg)});(globalThis as unknown as {prisma:PrismaClient}).prisma=db;
  const {registerStudent}=await import("../src/lib/student-accounts");
  const {dispatch,declarations}=await import("../src/lib/ai/runtime");
  const fixture=async()=>{
    const id=crypto.randomUUID(),school=await db.school.create({data:{name:"Fixture school",code:id,comped:true}});
    const admin=await db.user.create({data:{schoolId:school.id,name:"Principal",email:`${id}@example.test`,role:"ADMIN",passwordHash:"fixture"}});
    const year=await db.academicYear.create({data:{schoolId:school.id,name:"2026-27",current:true,startsOn:utcDay("2026-04-01"),endsOn:utcDay("2027-03-31")}});
    const c=await db.class.create({data:{schoolId:school.id,yearId:year.id,grade:9,section:"A",name:"9A"}});
    const other=await db.class.create({data:{schoolId:school.id,yearId:year.id,grade:8,section:"B",name:"8B"}});
    const subject=await db.subject.create({data:{schoolId:school.id,name:"Science",code:"SCI"}});
    const teacherUser=await db.user.create({data:{schoolId:school.id,name:"Kavya",email:`t-${id}@example.test`,role:"TEACHER",passwordHash:"fixture"}});
    const teacher=await db.teacher.create({data:{schoolId:school.id,userId:teacherUser.id,employeeNo:"T1"}});
    const actor:Actor={schoolId:school.id,role:"ADMIN",classIds:[],childIds:[],teacherId:null,perms:[],support:false,user:{id:admin.id,mustChangePassword:false},timezone:school.timezone,readOnly:false};
    const now=new Date("2026-10-06T19:00:00Z"),day=localDay(now,school.timezone);
    const hw=await db.homework.create({data:{schoolId:school.id,classId:c.id,subjectId:subject.id,teacherId:teacher.id,title:"Photosynthesis",description:"Explain how a plant makes food.",assignedOn:now,dueOn:utcDay(day)}});
    const student=await db.student.create({data:{schoolId:school.id,classId:c.id,name:"Student",admissionNo:"S1",rollNo:1,gender:"X"}});
    const studentUser=await db.user.create({data:{schoolId:school.id,name:"Student",email:`s-${id}@example.test`,role:"STUDENT",passwordHash:"fixture"}});
    await db.student.update({where:{id:student.id},data:{userId:studentUser.id}});
    const sa:Actor={...actor,role:"STUDENT",user:{id:studentUser.id,mustChangePassword:false},classIds:[other.id],childIds:["forged"]};
    return {school,admin,c,other,subject,teacherUser,teacher,actor,student,studentUser,sa,now,day,hw};
  };
  try{
    await t.test("School-local day and homework help use the student's actual class",async()=>{
      const f=await fixture(),updates=await personalUpdates(db,f.sa,f.now);
      assert.equal(updates.date,"2026-10-07");assert.match(updates.updates[0].text,/posted Science homework today/);
      assert.equal((await scopedHomework(db,f.sa,f.hw.id)).description,f.hw.description);
      const foreign=await db.homework.create({data:{schoolId:f.school.id,classId:f.other.id,subjectId:f.subject.id,teacherId:f.teacher.id,title:"Secret class work",description:"Private",dueOn:utcDay(f.day)}});
      await assert.rejects(()=>scopedHomework(db,f.sa,foreign.id),AgentError);
      const other=await fixture();await assert.rejects(()=>scopedHomework(db,f.sa,other.hw.id),AgentError);
      assert.equal(await db.aiUsage.count(),0);assert.equal(await db.aiProposal.count(),0);
    });
    await t.test("Student reads are refreshed after roster moves and completed homework is omitted",async()=>{
      const f=await fixture();await db.homeworkSubmission.create({data:{homeworkId:f.hw.id,studentId:f.student.id,done:true}});
      assert.equal((await personalUpdates(db,f.sa,f.now)).updates.length,0);
      await db.student.update({where:{id:f.student.id},data:{classId:f.other.id}});
      await assert.rejects(()=>scopedHomework(db,f.sa,f.hw.id),AgentError);
      await db.student.update({where:{id:f.student.id},data:{active:false}});
      await assert.rejects(()=>personalUpdates(db,f.sa,f.now),AgentError);
      await assert.rejects(()=>dispatch(f.sa,"My updates",{id:"u",name:"get_my_updates",arguments:{}}),AgentError);
    });
    await t.test("Parents with children in different classes never receive another class's homework or completed prompts",async()=>{
      const f=await fixture(),u=await db.user.create({data:{schoolId:f.school.id,name:"Parent",email:`p-${crypto.randomUUID()}@example.test`,role:"PARENT",passwordHash:"fixture"}});
      const second=await db.student.create({data:{schoolId:f.school.id,classId:f.other.id,name:"Second child",admissionNo:"S2",rollNo:2,gender:"X"}});
      await db.guardian.createMany({data:[{userId:u.id,studentId:f.student.id},{userId:u.id,studentId:second.id}]});
      await db.homeworkSubmission.create({data:{homeworkId:f.hw.id,studentId:f.student.id,done:true}});
      const pa:Actor={...f.actor,role:"PARENT",user:{id:u.id,mustChangePassword:false},classIds:["forged"]};
      assert.equal((await personalUpdates(db,pa,f.now)).updates.length,0);
      assert.equal((await scopedHomework(db,pa,f.hw.id)).id,f.hw.id);
      const other=await fixture();await assert.rejects(()=>scopedHomework(db,pa,other.hw.id),AgentError);
    });
    await t.test("Principals see uncovered lessons, teachers see relevant absence without private reason",async()=>{
      const f=await fixture();await db.classSubject.create({data:{classId:f.c.id,subjectId:f.subject.id,teacherId:f.teacher.id}});
      const a=await db.teacherAvailability.create({data:{schoolId:f.school.id,teacherId:f.teacher.id,date:utcDay(f.day),kind:"ABSENT"}});
      await db.timetableSlot.create({data:{schoolId:f.school.id,classId:f.c.id,subjectId:f.subject.id,teacherId:f.teacher.id,day:(utcDay(f.day).getUTCDay()+6)%7,period:1,startTime:"09:00",endTime:"10:00"}});
      assert.match((await personalUpdates(db,f.actor,f.now)).updates[0].text,/1 lesson needs substitute coverage/);
      const colleagueUser=await db.user.create({data:{schoolId:f.school.id,name:"Hasan",email:`colleague-${crypto.randomUUID()}@example.test`,role:"TEACHER",passwordHash:"fixture"}});
      const colleague=await db.teacher.create({data:{schoolId:f.school.id,userId:colleagueUser.id,employeeNo:"T2"}});
      await db.class.update({where:{id:f.c.id},data:{classTeacherId:colleague.id}});
      const ta:Actor={...f.actor,role:"TEACHER",teacherId:colleague.id,user:{id:colleagueUser.id,mustChangePassword:false}};
      assert.match((await personalUpdates(db,ta,f.now)).updates[0].text,/No reason is recorded/);
      await db.teacherAvailability.update({where:{id:a.id},data:{reason:"Private medical information"}});
      const text=JSON.stringify(await personalUpdates(db,ta,f.now));assert.doesNotMatch(text,/Private medical|No reason|without giving/);
      const foreign=await fixture();assert.equal((await personalUpdates(db,foreign.actor,f.now)).updates.length,0);
      assert.equal(await db.notification.count(),0);assert.equal(await db.substitute.count(),0);
    });
    await t.test("Absent coworkers outside the teacher's assignments never appear",async()=>{
      const f=await fixture();await db.teacherAvailability.create({data:{schoolId:f.school.id,teacherId:f.teacher.id,date:utcDay(f.day),kind:"ABSENT"}});
      const u=await db.user.create({data:{schoolId:f.school.id,name:"Other teacher",email:`o-${crypto.randomUUID()}@example.test`,role:"TEACHER",passwordHash:"fixture"}}),teacher=await db.teacher.create({data:{schoolId:f.school.id,userId:u.id,employeeNo:"T2"}});
      const ta:Actor={...f.actor,role:"TEACHER",teacherId:teacher.id,classIds:[f.c.id],user:{id:u.id,mustChangePassword:false}};
      assert.equal((await personalUpdates(db,ta,f.now)).updates.length,0);
    });
    await t.test("Students and teachers cannot turn suggestions into school writes",async()=>{
      const f=await fixture();assert.deepEqual(declarations(f.sa).map(d=>d.name),["get_my_updates","get_homework"]);
      await assert.rejects(()=>dispatch(f.sa,"Create 8C",{id:"write",name:"create_classes",arguments:{class_codes:["8C"],academic_year:"active"}}),AgentError);
      assert.equal(await db.aiProposal.count(),0);
    });
    await t.test("Student invitation creates one linked account atomically and cannot be replayed",async()=>{
      const f=await fixture(),st=await db.student.create({data:{schoolId:f.school.id,classId:f.c.id,name:"New student",admissionNo:"S2",rollNo:2,gender:"X"}});
      const token=crypto.randomUUID().replaceAll("-","");await db.invite.create({data:{schoolId:f.school.id,createdById:f.admin.id,kind:"STUDENT",studentId:st.id,token,maxUses:1,expiresAt:new Date(Date.now()+60000)}});
      const user=await registerStudent(token,`${crypto.randomUUID()}@example.test`,"fixture-password");
      assert.equal(user.role,"STUDENT");assert.equal((await db.student.findUniqueOrThrow({where:{id:st.id}})).userId,user.id);
      await assert.rejects(()=>registerStudent(token,`${crypto.randomUUID()}@example.test`,"fixture-password"),AgentError);
      assert.equal((await db.invite.findUniqueOrThrow({where:{token}})).uses,1);
    });
    await t.test("Failed account creation rolls back invitation consumption; foreign student links are rejected",async()=>{
      const f=await fixture(),st=await db.student.create({data:{schoolId:f.school.id,classId:f.c.id,name:"New student",admissionNo:"S2",rollNo:2,gender:"X"}}),token=crypto.randomUUID().replaceAll("-","");
      await db.invite.create({data:{schoolId:f.school.id,createdById:f.admin.id,kind:"STUDENT",studentId:st.id,token,maxUses:1,expiresAt:new Date(Date.now()+60000)}});
      await assert.rejects(()=>registerStudent(token,f.admin.email,"fixture-password"));
      assert.equal((await db.invite.findUniqueOrThrow({where:{token}})).uses,0);assert.equal((await db.student.findUniqueOrThrow({where:{id:st.id}})).userId,null);
      const other=await fixture();await db.invite.update({where:{token},data:{schoolId:other.school.id}});
      await assert.rejects(()=>registerStudent(token,`${crypto.randomUUID()}@example.test`,"fixture-password"),AgentError);
    });
  }finally{await db.$disconnect();await pg.close();}
});
