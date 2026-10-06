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
    const schoolFixture=async()=>{
      const f=await fixture();
      const c=await client.class.create({data:{schoolId:f.school.id,yearId:f.year.id,grade:9,section:"A",name:"9A"}});
      const subject=await client.subject.create({data:{schoolId:f.school.id,name:"Mathematics",code:"MATH"}});
      const u=await client.user.create({data:{schoolId:f.school.id,name:"Teacher One",email:`${crypto.randomUUID()}@example.test`,passwordHash:"private-hash",role:"TEACHER"}});
      const teacher=await client.teacher.create({data:{schoolId:f.school.id,userId:u.id,employeeNo:"T1"}});
      const cs=await client.classSubject.create({data:{classId:c.id,subjectId:subject.id,teacherId:teacher.id}});
      const student=await client.student.create({data:{schoolId:f.school.id,classId:c.id,name:"Student One",admissionNo:"A1",rollNo:1,gender:"F"}});
      const parent=await client.user.create({data:{schoolId:f.school.id,name:"Parent One",email:`${crypto.randomUUID()}@example.test`,passwordHash:"private-parent-hash",role:"PARENT"}});
      await client.guardian.create({data:{studentId:student.id,userId:parent.id}});
      const today=localDay(new Date(),f.actor.timezone),future=utcDay(today);future.setUTCDate(future.getUTCDate()+7);
      return {...f,c,subject,u,teacher,cs,student,parent,today,future:future.toISOString().slice(0,10)};
    };
    const batch=async(actor:Actor,actions:unknown[])=>{
      const reply=await dispatch(actor,"Prepare my school operations",{id:"batch",name:"prepare_school_actions",arguments:{summary:"Requested school operations",actions}});
      assert.ok(reply.approval);return reply.approval!;
    };
    const approve=async(actor:Actor,actions:unknown[])=>{const p=await batch(actor,actions);return await confirmProposal(actor,p.id,p.fingerprint) as Record<string,unknown>;};
    await t.test("principal can search Class IX records; teacher and parent cannot access the administrative catalog",async()=>{
      const f=await schoolFixture(),other=await schoolFixture();
      const result=await dispatch(f.actor,"Find Class IX",{id:"search",name:"search_school_records",arguments:{resource:"classes",query:"",class_id:null,grade:9,offset:0}});
      const json=JSON.stringify(result.data);assert.ok(json.includes(f.c.id));assert.ok(!json.includes(other.c.id));assert.ok(!json.includes("passwordHash"));
      const teachers=await dispatch(f.actor,"Find staff",{id:"search",name:"search_school_records",arguments:{resource:"teachers",query:"",class_id:f.c.id,grade:null,offset:0}});
      assert.ok(JSON.stringify(teachers.data).includes("Teacher One"));assert.ok(!JSON.stringify(teachers.data).includes("private-hash"));
      for(const [role,u] of [["TEACHER",f.u],["PARENT",f.parent]] as const) {
        const actor={...f.actor,role,user:{id:u.id,mustChangePassword:false},teacherId:role==="TEACHER"?f.teacher.id:null};
        await assert.rejects(()=>dispatch(actor,"Search",{id:"x",name:"search_school_records",arguments:{resource:"students",query:"",class_id:null,grade:null,offset:0}}),AgentError);
        await assert.rejects(()=>batch(actor,[{action:"create_subject",name:"Science",code:"SCI"}]),AgentError);
      }
    });
    await t.test("teacher meeting is previewed without writes, then created once with explicit attendees and notifications",async()=>{
      const f=await schoolFixture();const operation={action:"schedule_staff_meeting",title:"Class IX planning",agenda:"Review teaching progress",date:f.future,start_time:"15:00",end_time:"16:00",venue:"Staff room",class_ids:[f.c.id],teacher_ids:[]};
      const p=await batch(f.actor,[operation]);assert.equal(await client.schoolMeeting.count({where:{schoolId:f.school.id}}),0);assert.equal(await client.notification.count({where:{schoolId:f.school.id}}),0);
      assert.ok(JSON.stringify(p.changes).includes("Teacher One"));assert.ok(JSON.stringify(p.changes).includes("Staff room"));
      const result=await confirmProposal(f.actor,p.id,p.fingerprint);assert.deepEqual(await confirmProposal(f.actor,p.id,p.fingerprint),result);
      const meeting=await client.schoolMeeting.findFirstOrThrow({where:{schoolId:f.school.id}});assert.deepEqual(meeting.teacherIds,[f.teacher.id]);assert.equal(meeting.startTime,"15:00");
      assert.equal(await client.notification.count({where:{schoolId:f.school.id,userId:f.u.id}}),1);
      await approve(f.actor,[{action:"cancel_staff_meeting",meeting_id:meeting.id}]);assert.equal(await client.schoolMeeting.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("meeting rejects conflicts, inactive teachers and foreign-school attendees",async()=>{
      const f=await schoolFixture(),other=await schoolFixture(),day=(utcDay(f.future).getUTCDay()+6)%7;
      await client.timetableSlot.create({data:{schoolId:f.school.id,classId:f.c.id,subjectId:f.subject.id,teacherId:f.teacher.id,day,period:1,startTime:"15:00",endTime:"16:00"}});
      const op={action:"schedule_staff_meeting",title:"Planning",agenda:"Review",date:f.future,start_time:"15:30",end_time:"16:30",venue:null,class_ids:[f.c.id],teacher_ids:[]};
      await assert.rejects(()=>batch(f.actor,[op]),AgentError);
      await assert.rejects(()=>batch(f.actor,[{...op,start_time:"17:00",end_time:"18:00",teacher_ids:[other.teacher.id]}]),AgentError);
      await client.user.update({where:{id:f.u.id},data:{active:false}});await assert.rejects(()=>batch(f.actor,[{...op,start_time:"17:00",end_time:"18:00"}]),AgentError);
      assert.equal(await client.schoolMeeting.count({where:{schoolId:f.school.id}}),0);
    });
    await t.test("changed records, forged payloads, expiry, role revocation and foreign principals block batch approval",async()=>{
      for(const mode of ["data","payload","expiry","role","foreign"]) {
        const f=await schoolFixture(),p=await batch(f.actor,[{action:"create_subject",name:"Science",code:"SCI"}]);
        let actor=f.actor;
        if(mode==="data")await client.student.update({where:{id:f.student.id},data:{name:"Changed"}});
        if(mode==="payload")await client.aiProposal.update({where:{id:p.id},data:{payload:{...p.changes,summary:"Tampered"} as never}});
        if(mode==="expiry")await client.aiProposal.update({where:{id:p.id},data:{expiresAt:new Date(0)}});
        if(mode==="role")await client.user.update({where:{id:f.user.id},data:{role:"PARENT"}});
        if(mode==="foreign")actor=(await schoolFixture()).actor;
        await assert.rejects(()=>confirmProposal(actor,p.id,p.fingerprint),AgentError);
        assert.equal(await client.subject.count({where:{schoolId:f.school.id,code:"SCI"}}),0);
      }
    });
    await t.test("multi-action conflicts and audit failure roll back every action and notification",async()=>{
      const f=await schoolFixture();const slot={action:"set_timetable_period",class_id:f.c.id,subject_id:f.subject.id,teacher_id:f.teacher.id,day:0,period:1,start_time:"09:00",end_time:"10:00"};
      await assert.rejects(()=>batch(f.actor,[slot,{...slot,period:2,start_time:"09:30",end_time:"10:30"}]),AgentError);assert.equal(await client.timetableSlot.count({where:{schoolId:f.school.id}}),0);
      const q=await batch(f.actor,[{action:"post_announcement",title:"Test announcement",body:"Hello parents",audience:"ALL",class_id:null,pinned:false},{action:"create_subject",name:"Science",code:"SCI"}]);
      await pg.exec(`CREATE FUNCTION fail_batch_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action = 'AI_EXECUTED' THEN RAISE EXCEPTION 'simulated audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_batch_audit BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION fail_batch_audit();`);
      try {await assert.rejects(()=>confirmProposal(f.actor,q.id,q.fingerprint));assert.equal(await client.announcement.count({where:{schoolId:f.school.id}}),0);assert.equal(await client.notification.count({where:{schoolId:f.school.id}}),0);assert.equal(await client.subject.count({where:{schoolId:f.school.id,code:"SCI"}}),0);}finally{await pg.exec('DROP TRIGGER fail_batch_audit ON "AuditLog"; DROP FUNCTION fail_batch_audit();');}
    });
    await t.test("communications, parent meetings and homework use approved audiences and real module records",async()=>{
      const f=await schoolFixture();
      await approve(f.actor,[{action:"post_announcement",title:"Class notice",body:"Bring science notebooks",audience:"CLASS",class_id:f.c.id,pinned:true},{action:"send_message",user_id:f.u.id,body:"Please review the class plan."}]);
      assert.equal(await client.announcement.count({where:{schoolId:f.school.id,classId:f.c.id}}),1);assert.equal(await client.message.count({where:{senderId:f.user.id}}),1);
      const {announcementScope}=await import("../src/lib/announcements-scope");
      assert.equal(await client.announcement.count({where:announcementScope({schoolId:f.school.id,role:"PARENT",classIds:[f.c.id]})}),1);
      assert.equal(await client.announcement.count({where:announcementScope({schoolId:f.school.id,role:"PARENT",classIds:[]})}),0);
      const hw={action:"create_homework",class_id:f.c.id,subject_id:f.subject.id,title:"Fractions practice",description:"Complete exercises 1–5",due_date:f.future};
      await approve(f.actor,[hw]);const homework=await client.homework.findFirstOrThrow({where:{schoolId:f.school.id}});assert.equal(homework.teacherId,f.teacher.id);assert.equal(await client.homeworkSubmission.count({where:{homeworkId:homework.id}}),1);
      await approve(f.actor,[{action:"set_homework_submission",homework_id:homework.id,student_id:f.student.id,done:true}]);assert.equal((await client.homeworkSubmission.findFirstOrThrow({where:{homeworkId:homework.id}})).done,true);
      await approve(f.actor,[{action:"close_homework",homework_id:homework.id}]);assert.equal((await client.homework.findUniqueOrThrow({where:{id:homework.id}})).status,"CLOSED");
      await approve(f.actor,[{action:"schedule_parent_meeting",title:"Class IX parents",date:f.future,venue:"Hall",start_time:"09:00",end_time:"10:00",slot_minutes:15,class_ids:[f.c.id]}]);
      const ev=await client.ptmEvent.findFirstOrThrow({where:{schoolId:f.school.id}});assert.equal(await client.ptmSlot.count({where:{eventId:ev.id}}),4);await approve(f.actor,[{action:"cancel_parent_meeting",event_id:ev.id}]);assert.equal(await client.ptmSlot.count({where:{eventId:ev.id}}),0);
      const ann=await client.announcement.findFirstOrThrow({where:{schoolId:f.school.id}});await approve(f.actor,[{action:"delete_announcement",announcement_id:ann.id}]);assert.equal(await client.announcement.count({where:{id:ann.id}}),0);
    });
    await t.test("students, subjects, assignments, diary, portions and account access apply only approved values",async()=>{
      const f=await schoolFixture();
      await approve(f.actor,[{action:"create_subject",name:"Science",code:"SCI"},{action:"update_class",class_id:f.c.id,room:"101",class_teacher_id:f.teacher.id}]);assert.equal((await client.class.findUniqueOrThrow({where:{id:f.c.id}})).roomNo,"101");
      const sci=await client.subject.findFirstOrThrow({where:{schoolId:f.school.id,code:"SCI"}});
      await approve(f.actor,[{action:"assign_subject_teacher",class_id:f.c.id,subject_id:sci.id,teacher_id:f.teacher.id}]);
      const assignment=await client.classSubject.findFirstOrThrow({where:{classId:f.c.id,subjectId:sci.id}});await approve(f.actor,[{action:"remove_subject_assignment",assignment_id:assignment.id}]);assert.equal(await client.classSubject.count({where:{id:assignment.id}}),0);
      await approve(f.actor,[{action:"create_student",class_id:f.c.id,name:"Student Two",gender:"M",admission_number:"A2",roll_number:2,date_of_birth:"2012-01-01"}]);const st=await client.student.findFirstOrThrow({where:{schoolId:f.school.id,admissionNo:"A2"}});
      await approve(f.actor,[{action:"update_student",student_id:st.id,class_id:f.c.id,name:"Student Two Updated",roll_number:3,active:true},{action:"link_parent",student_id:st.id,user_id:f.parent.id,relation:"Father"}]);assert.equal(await client.guardian.count({where:{studentId:st.id,userId:f.parent.id}}),1);
      await approve(f.actor,[{action:"add_diary_entry",class_id:f.c.id,teacher_id:f.teacher.id,date:f.today,subject:"Mathematics",topic:"Fractions",notes:"Chapter 1"},{action:"add_portion",class_id:f.c.id,subject_id:f.subject.id,date:f.today,topic:"Fractions",notes:null}]);assert.equal(await client.diaryEntry.count({where:{schoolId:f.school.id}}),1);const portion=await client.portion.findFirstOrThrow({where:{schoolId:f.school.id}});await approve(f.actor,[{action:"delete_portion",portion_id:portion.id}]);
      await approve(f.actor,[{action:"update_teacher_access",teacher_id:f.teacher.id,position:"Coordinator",permissions:["REPORTS"],max_daily_periods:6,max_substitute_periods:1}]);assert.deepEqual((await client.teacher.findUniqueOrThrow({where:{id:f.teacher.id}})).permissions,["REPORTS"]);
      await approve(f.actor,[{action:"set_account_active",user_id:f.parent.id,active:false}]);assert.equal((await client.user.findUniqueOrThrow({where:{id:f.parent.id}})).active,false);
      await approve(f.actor,[{action:"update_school_branding",brand_color:"#4F46E5",signatory_name:"Principal",signatory_title:"Head"}]);assert.equal((await client.school.findUniqueOrThrow({where:{id:f.school.id}})).brandColor,"#4F46E5");
    });
    await t.test("timetable, exams, marks, attendance and leave keep academic constraints",async()=>{
      const f=await schoolFixture();
      await approve(f.actor,[{action:"set_timetable_period",class_id:f.c.id,subject_id:f.subject.id,teacher_id:f.teacher.id,day:0,period:1,start_time:"09:00",end_time:"10:00"}]);const slot=await client.timetableSlot.findFirstOrThrow({where:{schoolId:f.school.id}});await approve(f.actor,[{action:"remove_timetable_period",slot_id:slot.id}]);
      await approve(f.actor,[{action:"create_exam",class_id:f.c.id,name:"UT1",max_marks:50,pass_marks:20,start_date:f.future}]);const ex=await client.exam.findFirstOrThrow({where:{schoolId:f.school.id}});
      await approve(f.actor,[{action:"set_exam_schedule",exam_id:ex.id,subject_id:f.subject.id,date:f.future,start_time:"09:00"},{action:"record_marks",exam_id:ex.id,subject_id:f.subject.id,entries:[{student_id:f.student.id,score:42}]}]);assert.equal((await client.mark.findFirstOrThrow({where:{examId:ex.id}})).score,42);
      await assert.rejects(()=>batch(f.actor,[{action:"record_marks",exam_id:ex.id,subject_id:f.subject.id,entries:[{student_id:f.student.id,score:51}]}]),AgentError);
      await approve(f.actor,[{action:"set_exam_published",exam_id:ex.id,published:true}]);await assert.rejects(()=>batch(f.actor,[{action:"record_marks",exam_id:ex.id,subject_id:f.subject.id,entries:[{student_id:f.student.id,score:40}]}]),AgentError);
      await assert.rejects(()=>batch(f.actor,[{action:"record_attendance",class_id:f.c.id,date:f.future,entries:[{student_id:f.student.id,status:"PRESENT",note:null}]}]),AgentError);
      await approve(f.actor,[{action:"record_attendance",class_id:f.c.id,date:f.today,entries:[{student_id:f.student.id,status:"ABSENT",note:"Sick"}]}]);const session=await client.attendanceSession.findFirstOrThrow({where:{schoolId:f.school.id}});assert.equal(session.status,"APPROVED");
      await approve(f.actor,[{action:"review_attendance",session_id:session.id,approve:false,note:"Review status"}]);assert.equal((await client.attendanceSession.findUniqueOrThrow({where:{id:session.id}})).status,"REJECTED");
      const leave=await client.leaveRequest.create({data:{schoolId:f.school.id,studentId:f.student.id,requestedById:f.parent.id,fromDate:utcDay(f.today),toDate:utcDay(f.today),reason:"Sick"}});await approve(f.actor,[{action:"decide_leave",leave_id:leave.id,approve:true,note:"Approved"}]);assert.equal((await client.leaveRequest.findUniqueOrThrow({where:{id:leave.id}})).status,"APPROVED");
    });
    await t.test("fee records cannot target another class, exceed bounds, delete payment history or run twice",async()=>{
      const f=await schoolFixture();await approve(f.actor,[{action:"create_fee",name:"Tuition",amount:2000,due_date:f.future,class_id:f.c.id}]);const fee=await client.feeItem.findFirstOrThrow({where:{schoolId:f.school.id}});
      const action={action:"record_fee_payment",student_id:f.student.id,fee_id:fee.id,amount:500,mode:"Cash",date:f.today,reference:null,note:null};const p=await batch(f.actor,[action]);assert.equal(await client.feePayment.count({where:{schoolId:f.school.id}}),0);await confirmProposal(f.actor,p.id,p.fingerprint);await confirmProposal(f.actor,p.id,p.fingerprint);assert.equal(await client.feePayment.count({where:{schoolId:f.school.id}}),1);
      await assert.rejects(()=>batch(f.actor,[{action:"delete_fee",fee_id:fee.id}]),AgentError);await assert.rejects(()=>batch(f.actor,[{...action,mode:"Waiver / concession"}]),AgentError);
      await approve(f.actor,[{action:"create_fee",name:"No payments",amount:100,due_date:f.future,class_id:null}]);const empty=await client.feeItem.findFirstOrThrow({where:{schoolId:f.school.id,name:"No payments"}});await approve(f.actor,[{action:"delete_fee",fee_id:empty.id}]);assert.equal(await client.feeItem.count({where:{id:empty.id}}),0);
    });
    await t.test("invitation links stay private in principal results and are omitted from searches and audit logs",async()=>{
      const f=await schoolFixture();
      for(const action of [{action:"create_teacher_invitation"},{action:"create_parent_invitation",student_id:f.student.id},{action:"create_reset_link",user_id:f.u.id}]) {
        const result=await approve(f.actor,[action]);const actions=result.actions as {path:string}[];assert.match(actions[0].path,/^\/(join|reset)\//);
      }
      const inv=await client.invite.findFirstOrThrow({where:{schoolId:f.school.id}});const result=await dispatch(f.actor,"Find invitations",{id:"search",name:"search_school_records",arguments:{resource:"invitations",query:"",class_id:null,grade:null,offset:0}});
      assert.ok(!JSON.stringify(result).includes(inv.token));const audits=await client.auditLog.findMany({where:{schoolId:f.school.id}});assert.ok(!JSON.stringify(audits).includes(inv.token));
      await approve(f.actor,[{action:"revoke_invitation",invitation_id:inv.id}]);assert.ok((await client.invite.findUniqueOrThrow({where:{id:inv.id}})).revokedAt);
    });
  } finally {await client.$disconnect();await pg.close();}
});
