import { test } from "node:test";
import assert from "node:assert/strict";
import { AgentError, exactAbsence, hash, exactClasses, exactDate, exactTeacher, exactYear, overlap } from "../src/lib/ai/policy";
import { planCoverage, isFree, type PlanningData, type Slot } from "../src/lib/ai/planner";
import { GeminiProvider, runAgent, type ModelProvider, type ProviderTurn } from "../src/lib/ai/provider";
import { assertActor, declarations, mayUse, type Actor } from "../src/lib/ai/runtime";
import { toolByName, validateCall } from "../src/lib/ai/tools";
import { calendarDate } from "../src/lib/ai/operations";
const now=new Date("2026-10-06T20:00:00Z");
test("dates use school timezone across UTC midnight",()=>{
  assert.equal(exactDate("attendance today","today","Asia/Kolkata",now),"2026-10-07");
  assert.equal(exactDate("attendance tomorrow","tomorrow","Asia/Kolkata",now),"2026-10-08");
});
test("date ambiguity, changed date and invalid calendar values are rejected",()=>{
  for (const [request,phrase] of [["today and tomorrow","today"],["tomorrow","today"],["on 2026-02-30","2026-02-30"],["show timetable","today"]]) assert.throws(()=>exactDate(request,phrase,"Asia/Kolkata",now),AgentError);
});
test("class values, grade and counts are preserved",()=>{
  exactClasses("Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D.",["8A","8B","8C","8D"]);
  exactClasses("Create four Class 8 divisions: 8A, 8B, 8C, 8D",["8A","8B","8C","8D"]);
  assert.throws(()=>exactClasses("Create three divisions for Grade 7",["7A","7B","7C"]),AgentError);
  assert.throws(()=>exactClasses("Create 4 Class 8 divisions: 8A, 8B",["8A","8B"]),AgentError);
  assert.throws(()=>exactClasses("Create Class 8 division 9A",["9A"]),AgentError);
  assert.throws(()=>exactClasses("Create 8A, 8B",["8A","8A","8B"]),AgentError);
  assert.throws(()=>exactClasses("Create 8A, 8B",["8A","8C"]),AgentError);
});
test("teacher names are exact tokens, not substrings or invented aliases",()=>{
  exactTeacher("Mrs. Fathima is absent tomorrow","Mrs. Fathima");
  assert.throws(()=>exactTeacher("Fathima is absent","Mrs. Fathima"),AgentError);
  assert.throws(()=>exactTeacher("Sameera is absent","Sameer"),AgentError);
});
test("academic year derives from backend only when omitted",()=>{
  assert.equal(exactYear("Create 8A","active","2026–27"),"2026–27");
  assert.equal(exactYear("Create 8A for 2026–27","2026–27","2026–27"),"2026–27");
  assert.throws(()=>exactYear("Create 8A","2025–26","2026–27"),AgentError);
  assert.throws(()=>exactYear("Create 8A for 2025–26","active","2026–27"),AgentError);
});
const actor=(role:Actor["role"]="ADMIN",perms:string[]=[]):Actor=>({schoolId:"school-a",role,classIds:["8B"],childIds:[],teacherId:"t",perms,support:false,user:{id:"user-a",mustChangePassword:false},timezone:"Asia/Kolkata",readOnly:false});
test("parent cannot prepare writes or query school attendance/status",()=>{
  const allowed=declarations(actor("PARENT")).map(t=>t.name);
  assert.deepEqual(allowed,["get_class_timetable"]);
  assert.equal(mayUse(actor("PARENT"),toolByName("create_classes")),false);
});
test("delegated teacher can read reports but approvals remain principal-only",()=>{
  const allowed=declarations(actor("TEACHER",["REPORTS","SUBSTITUTES","CLASSES"])).map(t=>t.name);
  assert.ok(allowed.includes("get_school_status"));
  assert.ok(!allowed.includes("create_classes"));
  assert.ok(!allowed.includes("plan_substitute_coverage"));
});
test("support mode, owner accounts and forced password changes cannot use AI",()=>{
  assert.throws(()=>assertActor({...actor(),support:true}),AgentError);
  assert.throws(()=>assertActor(actor("SUPER_ADMIN")),AgentError);
  assert.throws(()=>assertActor({...actor(),user:{id:"u",mustChangePassword:true}}),AgentError);
});
test("read-only school plans cannot propose writes",()=>{
  assert.equal(mayUse({...actor(),readOnly:true},toolByName("create_classes")),false);
  assert.equal(mayUse({...actor(),readOnly:true},toolByName("get_school_status")),true);
});
test("unknown tools, direct assignments and extra tenant arguments fail closed",()=>{
  assert.throws(()=>validateCall("assign_substitute",{approved_plan_id:"x"}),AgentError);
  assert.throws(()=>validateCall("invented_tool",{}),AgentError);
  assert.throws(()=>validateCall("create_classes",{class_codes:["8A"],academic_year:"active",schoolId:"school-b"}),AgentError);
  assert.throws(()=>validateCall("get_available_teachers",{period:true,date:"today"}),AgentError);
});
const slot=(id:string,period=1,startTime="09:00",endTime="09:40",teacherId="absent"):Slot=>({id,period,startTime,endTime,teacherId,classId:id,className:id,subjectId:"science",subjectName:"Science"});
const fixture=():PlanningData=>({slots:[slot("8B"),slot("9A",3,"11:00","11:40")],teachers:[{id:"sameer",name:"Mr. Sameer",userId:"s",subjectIds:["science"],maxSubstitutePeriods:2,maxDailyPeriods:8},{id:"aisha",name:"Mrs. Aisha",userId:"a",subjectIds:["science"],maxSubstitutePeriods:2,maxDailyPeriods:8}],availability:[],existing:[]});
test("substitute planner balances workloads deterministically",()=>{
  const result=planCoverage(fixture(),"absent");
  assert.equal(result.gaps.length,0);
  assert.deepEqual(result.assignments.map(a=>a.subTeacherId),["aisha","sameer"]);
});
test("overlap is based on clock intervals even across different period numbers",()=>{
  const d=fixture();d.slots.push(slot("busy",8,"09:10","09:50","aisha"));
  assert.equal(planCoverage(d,"absent").assignments[0].subTeacherId,"sameer");
  assert.equal(overlap({startTime:"09:00",endTime:"09:40"},{startTime:"09:40",endTime:"10:20"}),false);
});
test("absences and exam-duty blocks exclude candidates",()=>{
  const d=fixture();d.availability=[{teacherId:"aisha",kind:"ABSENT",startTime:null,endTime:null},{teacherId:"sameer",kind:"BLOCKED",startTime:"08:30",endTime:"10:00"}];
  const result=planCoverage(d,"absent");
  assert.deepEqual(result.gaps,[{className:"8B",period:1}]);
});
test("subject eligibility and substitute/day workload caps are hard constraints",()=>{
  const d=fixture();d.teachers[0].subjectIds=[];d.teachers[1].maxSubstitutePeriods=1;
  const result=planCoverage(d,"absent");
  assert.equal(result.assignments.length,1);assert.equal(result.gaps.length,1);
  d.teachers[1].maxDailyPeriods=0;
  assert.equal(planCoverage(d,"absent").assignments.length,0);
});
test("existing coverage is not overwritten and existing substitutes count as busy",()=>{
  const d=fixture();d.existing=[{slotId:"8B",subTeacherId:"aisha"}];
  assert.equal(planCoverage(d,"absent").assignments.length,1);
  assert.equal(isFree(d,d.teachers[1],d.slots[0]),false);
});
test("two simultaneously uncovered classes cannot use the same substitute",()=>{
  const d=fixture();d.slots=[slot("8B"),slot("9A",1)];d.teachers=d.teachers.slice(0,1);
  const result=planCoverage(d,"absent");assert.equal(result.assignments.length,1);assert.equal(result.gaps.length,1);
});
test("invalid timetable data is rejected instead of treated as free",()=>{
  const d=fixture();d.slots[0].startTime="oops";
  assert.throws(()=>planCoverage(d,"absent"),AgentError);
  assert.throws(()=>overlap({startTime:"12:00",endTime:"11:00"},{startTime:"10:00",endTime:"11:00"}),AgentError);
});
const turn=(calls:ProviderTurn["calls"],text=""):ProviderTurn=>({steps:[{type:"thought",signature:"preserve-exactly"},...calls.map(c=>({type:"function_call",...c}))],calls,text});
test("agent loops over authorized reads and preserves native steps and results",async()=>{
  const histories:Record<string,unknown>[][]=[];let n=0;
  const provider:ModelProvider={generate:async(input)=>{histories.push(structuredClone(input));return n++===0?turn([{id:"c1",name:"get_school_status",arguments:{date:"today"}}]):turn([],"Two teachers absent.");}};
  const result=await runAgent(provider,"Status today",[],[{name:"get_school_status"}],async()=>({data:{absentTeacherCount:2}}),"ADMIN");
  assert.equal(result.text,"Two teachers absent.");
  assert.ok(histories[1].some(s=>s.type==="thought" && s.signature==="preserve-exactly"));
  assert.ok(histories[1].some(s=>s.type==="function_result" && s.call_id==="c1"));
});
test("agent stops at proposal; model text cannot confirm a write",async()=>{
  let executed=0;
  const provider:ModelProvider={generate:async()=>turn([{id:"c",name:"create_classes",arguments:{class_codes:["8A"],academic_year:"active"}}],"Already created")};
  const result=await runAgent(provider,"Create 8A",[],[{name:"create_classes"}],async()=>{executed++;return {approval:{id:"p",fingerprint:"f",tool:"create_classes",expiresAt:"later",status:"PENDING",changes:{}}};},"ADMIN");
  assert.equal(executed,1);assert.ok(result.approval);assert.ok(!result.text.includes("Already created"));
});
test("unavailable call in a batch prevents all dispatches",async()=>{
  let dispatched=0;
  const provider:ModelProvider={generate:async()=>turn([{id:"1",name:"get_school_status",arguments:{date:"today"}},{id:"2",name:"confirm",arguments:{}}])};
  await assert.rejects(()=>runAgent(provider,"today",[],[{name:"get_school_status"}],async()=>{dispatched++;return {};},"ADMIN"),AgentError);
  assert.equal(dispatched,0);
});
test("agent enforces bounded rounds",async()=>{
  let rounds=0;
  const provider:ModelProvider={generate:async()=>{rounds++;return turn([{id:`c${rounds}`,name:"get_school_status",arguments:{date:"today"}}]);}};
  await assert.rejects(()=>runAgent(provider,"today",[],[{name:"get_school_status"}],async()=>({data:{}}),"ADMIN"),AgentError);
  assert.equal(rounds,6);
});
test("Gemini transport sends key in server header and opts out of stored interactions",async()=>{
  let payload:Record<string,unknown>={};
  const transport:typeof fetch=async(url,init)=>{
    assert.equal(url,"https://generativelanguage.googleapis.com/v1/interactions");
    assert.equal((init?.headers as Record<string,string>)["x-goog-api-key"],"test-secret");
    assert.ok(!String(init?.body).includes("test-secret"));
    payload=JSON.parse(String(init?.body));
    return new Response(JSON.stringify({steps:[{type:"model_output",content:[{type:"text",text:"Hello"}]}]}));
  };
  const result=await new GeminiProvider("test-secret","test-model",transport).generate([],"system",[]);
  assert.equal(result.text,"Hello");assert.equal(payload.store,false);
  assert.equal((payload.generation_config as Record<string,unknown>).max_output_tokens,8192);
});
test("Gemini errors never echo upstream credentials/content",async()=>{
  let requests=0; const logs:string[]=[];
  const provider=new GeminiProvider("test-secret","test",async()=>{requests++;return new Response("test-secret private student record",{status:403});},s=>logs.push(s));
  await assert.rejects(()=>provider.generate([],"",[]),e=>e instanceof AgentError && !e.message.includes("test-secret") && !e.message.includes("student"));
  assert.equal(requests,1); assert.doesNotMatch(logs.join("\n"),/test-secret|student/);
});
test("temporary Gemini failure retries the same request and dispatches one approval preview",async()=>{
  const bodies:string[]=[]; const signals:unknown[]=[]; let dispatched=0;
  const provider=new GeminiProvider("secret","model",async(_url,init)=>{
    bodies.push(String(init?.body)); signals.push(init?.signal);
    return bodies.length===1 ? new Response("private upstream content",{status:503}) : new Response(JSON.stringify({steps:[{type:"function_call",id:"one",name:"create_classes",arguments:{grade:8,divisions:["8A","8B","8C","8D"]}}]}));
  },()=>{});
  const reply=await runAgent(provider,"Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D.",[],[{name:"create_classes"}],async()=>{
    dispatched++;return {approval:{id:"proposal",fingerprint:"hash",tool:"create_classes",expiresAt:"later",status:"PENDING",changes:{}}};
  },"ADMIN");
  assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);assert.equal(signals[0],signals[1]);
  assert.equal(dispatched,1);assert.equal(reply.approval?.id,"proposal");
});
test("persistent Gemini outage stops after two attempts without dispatching school actions",async()=>{
  let requests=0;let dispatched=0;const logs:string[]=[];
  const provider=new GeminiProvider("secret","model",async()=>{requests++;return new Response("secret private student",{status:503});},s=>logs.push(s));
  await assert.rejects(()=>runAgent(provider,"create classes",[],[{name:"create_classes"}],async()=>{dispatched++;return {};},"ADMIN"),e=>e instanceof AgentError && /temporarily unavailable/.test(e.message) && !/unsupported|student|secret/.test(e.message));
  assert.equal(requests,2);assert.equal(dispatched,0);assert.doesNotMatch(logs.join("\n"),/secret|student/);
});
test("invalid configuration and request limits fail without automatic retries",async()=>{
  for (const status of [400,404,429]) {
    let requests=0;
    const provider=new GeminiProvider("secret","model",async()=>{requests++;return new Response("private",{status});},()=>{});
    await assert.rejects(()=>provider.generate([],"",[]),AgentError);assert.equal(requests,1);
  }
});
test("Gemini rejects malformed calls and duplicate IDs",async()=>{
  const provider=new GeminiProvider("test","test",async()=>new Response(JSON.stringify({steps:[{type:"function_call",id:"x",name:"get_school_status",arguments:{date:"today"}},{type:"function_call",id:"x",name:"get_school_status",arguments:{date:"today"}}]})));
  await assert.rejects(()=>provider.generate([],"",[]),AgentError);
});

test("stable hashes survive PostgreSQL JSON key reordering",()=>{assert.equal(hash({b:2,a:{d:4,c:3}}),hash({a:{c:3,d:4},b:2}));});
test("school action schemas reject invented controls, tenant overrides and invalid calendar dates",()=>{
  const wrap=(actions:unknown[])=>({summary:"Requested changes",actions});
  assert.throws(()=>validateCall("prepare_school_actions",wrap([{action:"execute_sql",sql:"DELETE FROM School"}])),AgentError);
  assert.throws(()=>validateCall("prepare_school_actions",wrap([{action:"create_subject",name:"Science",code:"SCI",schoolId:"foreign"}])),AgentError);
  assert.throws(()=>validateCall("prepare_school_actions",wrap([])),AgentError);
  assert.throws(()=>validateCall("prepare_school_actions",wrap(Array.from({length:11},(_,i)=>({action:"create_subject",name:`Science ${i}`,code:`S${i}`})))),AgentError);
  assert.equal(calendarDate.safeParse("2026-02-30").success,false);assert.equal(calendarDate.safeParse("2028-02-29").success,true);
  for(const role of ["TEACHER","PARENT"] as const)assert.ok(!declarations(actor(role)).some(t=>t.name==="prepare_school_actions"||t.name==="search_school_records"));
});
test("substitution planning cannot mark the wrong or non-absent teacher",()=>{exactAbsence("Mrs. Fathima is absent tomorrow","Mrs. Fathima");assert.throws(()=>exactAbsence("Mrs. Fathima is not absent tomorrow","Mrs. Fathima"),AgentError);assert.throws(()=>exactAbsence("Mrs. Fathima is absent tomorrow; Mr. Sameer is available","Mr. Sameer"),AgentError);});
