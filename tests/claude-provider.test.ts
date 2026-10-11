import {test} from "node:test";
import assert from "node:assert/strict";
import {ClaudeProvider} from "../src/lib/ai/claude";
import {runAgent} from "../src/lib/ai/provider";
import {AgentError} from "../src/lib/ai/policy";

const tools=[{name:"get_school_status",description:"Read school status",parameters:{type:"object",properties:{date:{type:"string"}},required:["date"],additionalProperties:false}}];

test("Claude tool-use loop uses official messages format and never executes the tool itself",async()=>{
  const requests:Record<string,unknown>[]=[];
  let calls=0;
  const transport:typeof fetch=async (_url,init)=>{
    calls++;
    const req=JSON.parse(String(init?.body)) as Record<string,unknown>;
    requests.push(req);
    if(calls===1) return new Response(JSON.stringify({
      type:"message",role:"assistant",stop_reason:"tool_use",
      content:[{type:"text",text:"Let me check."},{type:"tool_use",id:"toolu_test_1",name:"get_school_status",input:{date:"today"}}]
    }),{status:200});
    return new Response(JSON.stringify({type:"message",role:"assistant",stop_reason:"end_turn",content:[{type:"text",text:"One teacher is absent."}]}),{status:200});
  };
  let dispatched=0;
  const result=await runAgent(new ClaudeProvider("fake-test-token","claude-haiku-5-5",transport),
    "Show school status today",[],tools,async call=>{
      dispatched++;
      assert.equal(call.name,"get_school_status");
      assert.deepEqual(call.arguments,{date:"today"});
      return {data:{absentTeacherCount:1}};
    },"Role: ADMIN");
  assert.equal(result.text,"One teacher is absent.");
  assert.equal(dispatched,1);
  assert.equal(calls,2);
  const first=requests[0];
  assert.equal(first.model,"claude-haiku-5-5");
  assert.deepEqual((first.tools as {name:string;input_schema:unknown}[]).map(t=>t.name),["get_school_status"]);
  const secondMessages=requests[1].messages as {role:string;content:{type:string;tool_use_id?:string;content?:string}[]}[];
  assert.deepEqual(secondMessages.map(m=>m.role),["user","assistant","user"]);
  assert.equal(secondMessages[1].content[1].type,"tool_use");
  assert.equal(secondMessages[2].content[0].type,"tool_result");
  assert.equal(secondMessages[2].content[0].tool_use_id,"toolu_test_1");
  assert.match(String(secondMessages[2].content[0].content),/absentTeacherCount/);
});

test("Claude output with a write tool remains an approval preview",async()=>{
  let forwarded=0;
  const provider=new ClaudeProvider("fake","claude-haiku-5-5",async()=>new Response(JSON.stringify({
    type:"message",role:"assistant",stop_reason:"tool_use",
    content:[{type:"tool_use",id:"toolu_x",name:"create_classes",input:{class_codes:["8A"],academic_year:"active"}}]
  }),{status:200}));
  const result=await runAgent(provider,"Create 8A",[],[{name:"create_classes",description:"Prepare",parameters:{type:"object",properties:{},additionalProperties:true}}],async()=>{
    forwarded++;return {approval:{id:"p1",fingerprint:"fp",tool:"create_classes",expiresAt:"later",status:"PENDING",changes:{classCodes:["8A"]}}};
  },"Role: ADMIN");
  assert.equal(forwarded,1);
  assert.equal(result.approval?.status,"PENDING");
  assert.match(result.text,/Review/);
});

test("Claude rejects missing credentials and never exposes upstream private error bodies",async()=>{
  await assert.rejects(()=>new ClaudeProvider("","claude-haiku-5-5").generate([{type:"user_input",content:[{type:"text",text:"hello"}]}],"",[]),AgentError);
  const logs:string[]=[];
  const provider=new ClaudeProvider("fake-secret","claude-haiku-5-5",async()=>new Response("private student data fake-secret",{status:403}),x=>logs.push(x));
  await assert.rejects(()=>provider.generate([{type:"user_input",content:[{type:"text",text:"hello"}]}],"",[]),e=>e instanceof AgentError&&!/student|fake-secret/.test(e.message));
  assert.ok(logs.every(s=>!/student|fake-secret/.test(s)));
});
