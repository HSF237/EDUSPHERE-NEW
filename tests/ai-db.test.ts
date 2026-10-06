import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { Actor } from "../src/lib/ai/runtime";
import { AgentError, localDay, utcDay } from "../src/lib/ai/policy";

// PostgreSQL in-process fixture: no external credentials, network or production data.
test("AI database workflows",async t=>{
  const pg=new PGlite();
  await pg.waitReady;
  for (const dir of (await readdir("prisma/migrations",{withFileTypes:true})).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) await pg.exec(await readFile(`prisma/migrations/${dir.name}/migration.sql`,"utf8"));
  const client=new PrismaClient({adapter:new PrismaPGlite(pg)});
  (globalThis as unknown as {prisma:PrismaClient}).prisma=client;
  const {dispatch,confirmProposal,cancelProposal,reserveBudget}=await import("../src/lib/ai/runtime");
  const fixture=async()=>{
    const suffix=crypto.randomUUID();
    const school=await client.school.create({data:{name:"Test School",code:suffix,comped:true}});
    const user=await client.user.create({data:{schoolId:school.id,name:"Principal",email:`${suffix}@example.test`,passwordHash:"not-a-real-login",role:"ADMIN"}});
    const year=await client.academicYear.create({data:{schoolId:school.id,name:"2026–27",current:true,startsOn:new Date("2026-04-01"),endsOn:new Date("2027-03-31")}});
    const actor:Actor={schoolId:school.id,role:"ADMIN",classIds:[],childIds:[],teacherId:null,perms:[],support:false,user:{id:user.id,mustChangePassword:false},timezone:school.timezone,readOnly:false};
    return {school,user,year,actor};
  };
  const proposal=async(actor:Actor,codes=["8A","8B"])=>{
    const result=await dispatch(actor,`Create ${codes.join(", ")}`,{id:"call",name:"create_classes",arguments:{class_codes:codes,academic_year:"active"}});
    assert.ok(result.approval);
    return result.approval!;
  };
  try {
    await t.test("class preview has no school writes; confirmation is atomic and repeatable",async()=>{
      const f=await fixture(),p=await proposal(f.actor);
      assert.equal(await client.class.count({where:{schoolId:f.school.id}}),0);
      const result=await confirmProposal(f.actor,p.id,p.fingerprint);
      assert.equal(await client.class.count({where:{schoolId:f.school.id}}),2);
      assert.deepEqual(await confirmProposal(f.actor,p.id,p.fingerprint),result);
      assert.equal(await client.auditLog.count({where:{schoolId:f.school.id,action:"AI_EXECUTED"}}),1);
    });
    await t.test("other schools and other actors cannot approve a preview",async()=>{
      const a=await fixture(),b=await fixture(),p=await proposal(a.actor);
      await assert.rejects(()=>confirmProposal(b.actor,p.id,p.fingerprint),AgentError);
      const user=await client.user.create({data:{schoolId:a.school.id,name:"Other principal",email:`${crypto.randomUUID()}@example.test`,passwordHash:"test",role:"ADMIN"}});
      await assert.rejects(()=>confirmProposal({...a.actor,user:{id:user.id,mustChangePassword:false}},p.id,p.fingerprint),AgentError);
      assert.equal(await client.class.count({where:{schoolId:a.school.id}}),0);
    });
    await t.test("changed payloads and fingerprints cannot confirm",async()=>{
      const f=await fixture(),p=await proposal(f.actor);
      await assert.rejects(()=>confirmProposal(f.actor,p.id,"0".repeat(64)),AgentError);
      await client.aiProposal.update({where:{id:p.id},data:{payload:{classCodes:["9A"],yearId:f.year.id,academicYear:f.year.name}}});
      await assert.rejects(()=>confirmProposal(f.actor,p.id,p.fingerprint),AgentError);
      assert.equal(await client.class.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("expired and cancelled proposals never write",async()=>{
      const a=await fixture(),p=await proposal(a.actor);
      await client.aiProposal.update({where:{id:p.id},data:{expiresAt:new Date(0)}});
      await assert.rejects(()=>confirmProposal(a.actor,p.id,p.fingerprint),AgentError);
      const b=await fixture(),q=await proposal(b.actor);await cancelProposal(b.actor,q.id);
      await assert.rejects(()=>confirmProposal(b.actor,q.id,q.fingerprint),AgentError);
    });
    await t.test("role revocation, billing locks and disabled schools are rechecked",async()=>{
      for (const mode of ["role","billing","school"]){
        const f=await fixture(),p=await proposal(f.actor);
        if(mode==="role")await client.user.update({where:{id:f.user.id},data:{role:"TEACHER"}});
        if(mode==="billing")await client.school.update({where:{id:f.school.id},data:{comped:false}});
        if(mode==="school")await client.school.update({where:{id:f.school.id},data:{active:false}});
        await assert.rejects(()=>confirmProposal(f.actor,p.id,p.fingerprint),AgentError);
      }
    });
    await t.test("class or current-year changes invalidate stored previews",async()=>{
      const f=await fixture(),p=await proposal(f.actor);
      await client.class.create({data:{schoolId:f.school.id,yearId:f.year.id,grade:9,section:"A",name:"9A"}});
      await assert.rejects(()=>confirmProposal(f.actor,p.id,p.fingerprint),AgentError);
      assert.equal(await client.class.count({where:{schoolId:f.school.id}}),1);
    });
    await t.test("audit failure rolls back the write and preserves pending status",async()=>{
      const f=await fixture(),p=await proposal(f.actor);
      await pg.exec(`CREATE FUNCTION ai_test_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='AI_EXECUTED' THEN RAISE EXCEPTION 'fixture audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER ai_test_audit_failure BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION ai_test_audit_failure();`);
      try {await assert.rejects(()=>confirmProposal(f.actor,p.id,p.fingerprint));} finally {await pg.exec('DROP TRIGGER ai_test_audit_failure ON "AuditLog"; DROP FUNCTION ai_test_audit_failure();');}
      assert.equal(await client.class.count({where:{schoolId:f.school.id}}),0);
      assert.equal((await client.aiProposal.findUniqueOrThrow({where:{id:p.id}})).status,"PENDING");
    });
    await t.test("request budgets persist and a rejected increment rolls back",async()=>{
      const f=await fixture();process.env.AI_USER_DAILY_REQUESTS="1";
      try {await reserveBudget(f.actor);await assert.rejects(()=>reserveBudget(f.actor),AgentError);} finally {delete process.env.AI_USER_DAILY_REQUESTS;}
      assert.equal((await client.aiUsage.findFirstOrThrow({where:{schoolId:f.school.id,userId:f.user.id}})).requests,1);
      assert.equal((await client.aiUsage.findFirstOrThrow({where:{schoolId:f.school.id,userId:"*"}})).requests,1);
    });
    const substitutionFixture=async()=>{
      const f=await fixture();const day=localDay(new Date(),f.actor.timezone),date=utcDay(day),dow=(date.getUTCDay()+6)%7;
      const subject=await client.subject.create({data:{schoolId:f.school.id,name:"Science",code:"SCI"}});
      const teachers=[];
      for (const name of ["Mrs. Fathima","Mr. Sameer","Mrs. Aisha"]){
        const user=await client.user.create({data:{schoolId:f.school.id,name,email:`${crypto.randomUUID()}@example.test`,passwordHash:"test",role:"TEACHER"}});
        teachers.push(await client.teacher.create({data:{schoolId:f.school.id,userId:user.id,employeeNo:crypto.randomUUID()}}));
      }
      const classes=[];
      for (const [i,code] of ["8B","9A"].entries()) {
        const cls=await client.class.create({data:{schoolId:f.school.id,yearId:f.year.id,grade:Number(code[0]),section:code[1],name:code}});classes.push(cls);
        await client.classSubject.create({data:{classId:cls.id,subjectId:subject.id,teacherId:teachers[i+1].id}});
        await client.timetableSlot.create({data:{schoolId:f.school.id,classId:cls.id,subjectId:subject.id,teacherId:teachers[0].id,day:dow,period:i+1,startTime:i?"11:00":"09:00",endTime:i?"11:40":"09:40"}});
      }
      const p=(await dispatch(f.actor,`Mrs. Fathima is absent on ${day}. Arrange substitutes.`,{id:"sub",name:"plan_substitute_coverage",arguments:{teacher_name:"Mrs. Fathima",date:day}})).approval!;
      assert.ok(p);
      return {...f,teachers,classes,day,date,p};
    };
    await t.test("substitutions and teacher absence execute only after confirmation",async()=>{
      const f=await substitutionFixture();
      assert.equal(await client.substitute.count({where:{schoolId:f.school.id}}),0);
      assert.equal(await client.teacherAvailability.count({where:{schoolId:f.school.id}}),0);
      await confirmProposal(f.actor,f.p.id,f.p.fingerprint);
      assert.equal(await client.substitute.count({where:{schoolId:f.school.id}}),2);
      assert.equal(await client.teacherAvailability.count({where:{schoolId:f.school.id,kind:"ABSENT"}}),1);
      assert.equal(await client.notification.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("changed teacher availability invalidates a substitution preview",async()=>{
      const f=await substitutionFixture();
      await client.teacherAvailability.create({data:{schoolId:f.school.id,teacherId:f.teachers[1].id,date:f.date,kind:"ABSENT"}});
      await assert.rejects(()=>confirmProposal(f.actor,f.p.id,f.p.fingerprint),AgentError);
      assert.equal(await client.substitute.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("manual availability is principal-scoped, validated and audited",async()=>{
      const f=await substitutionFixture();
      const {saveAvailability,removeAvailability}=await import("../src/lib/ai/availability");
      await saveAvailability(f.actor,{teacherId:f.teachers[1].id,date:f.day,kind:"BLOCKED",startTime:"09:00",endTime:"10:00"});
      const row=await client.teacherAvailability.findFirstOrThrow({where:{schoolId:f.school.id,teacherId:f.teachers[1].id}});
      assert.equal(row.kind,"BLOCKED");
      assert.equal(await client.auditLog.count({where:{schoolId:f.school.id,action:"AI_AVAILABILITY_SAVED"}}),1);
      const other=await fixture();
      await assert.rejects(()=>saveAvailability(other.actor,{teacherId:f.teachers[1].id,date:f.day,kind:"ABSENT",startTime:"",endTime:""}),AgentError);
      await assert.rejects(()=>saveAvailability(f.actor,{teacherId:f.teachers[1].id,date:f.day,kind:"BLOCKED",startTime:"11:00",endTime:"10:00"}),AgentError);
      await removeAvailability(f.actor,row.id);
      assert.equal(await client.teacherAvailability.count({where:{id:row.id}}),0);
    });
    await t.test("an absence with approved coverage cannot be silently removed",async()=>{
      const f=await substitutionFixture();await confirmProposal(f.actor,f.p.id,f.p.fingerprint);
      const {removeAvailability}=await import("../src/lib/ai/availability");
      const row=await client.teacherAvailability.findFirstOrThrow({where:{schoolId:f.school.id,kind:"ABSENT"}});
      await assert.rejects(()=>removeAvailability(f.actor,row.id),AgentError);
    });
    await t.test("parent and teacher class scopes are revalidated from database",async()=>{
      const f=await substitutionFixture();
      const teacherUser=await client.user.findUniqueOrThrow({where:{id:f.teachers[1].userId}});
      const teacherActor:Actor={...f.actor,role:"TEACHER",teacherId:f.teachers[1].id,classIds:[f.classes[0].id],user:{id:teacherUser.id,mustChangePassword:false}};
      await client.classSubject.deleteMany({where:{teacherId:f.teachers[1].id}});
      await assert.rejects(()=>dispatch(teacherActor,`Show 8B timetable on ${f.day}`,{id:"read",name:"get_class_timetable",arguments:{class_code:"8B",date:f.day}}),AgentError);
      const parent=await client.user.create({data:{schoolId:f.school.id,name:"Parent",email:`${crypto.randomUUID()}@example.test`,passwordHash:"test",role:"PARENT"}});
      const parentActor:Actor={...f.actor,role:"PARENT",classIds:[f.classes[0].id],user:{id:parent.id,mustChangePassword:false}};
      await assert.rejects(()=>dispatch(parentActor,`Show 8B timetable on ${f.day}`,{id:"read",name:"get_class_timetable",arguments:{class_code:"8B",date:f.day}}),AgentError);
    });
  } finally {await client.$disconnect();await pg.close();}
});
