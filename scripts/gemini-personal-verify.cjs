// Actual Gemini, synthetic records only. No database access or school writes.
const assert = require("node:assert/strict");
const { GeminiProvider, runAgent } = require("../src/lib/ai/provider.ts");
const { TOOLS, validateCall } = require("../src/lib/ai/tools.ts");
(async () => {
  const declarations = TOOLS.filter(t => t.enabled && t.allowedRoles.includes("STUDENT")).map(t => ({type:"function",name:t.name,description:t.description,parameters:t.parameters}));
  assert.deepEqual(declarations.map(t=>t.name), ["get_my_updates","get_homework"]);
  const reads = new Set();
  const reply = await runAgent(new GeminiProvider(), "Use get_my_updates, then read the homework it identifies using get_homework. Give me a short first hint to understand the assignment, then ask what I have tried.", [], declarations, async call => {
    const args = validateCall(call.name,call.arguments); reads.add(call.name);
    if(call.name === "get_my_updates") return {data:{date:"2026-10-06",updates:[{id:"homework:synthetic-homework",text:"Your Science teacher posted photosynthesis homework today.",prompt:"Read homework with ID synthetic-homework",label:"Help with homework",href:"/homework"}]}};
    assert.equal(call.name,"get_homework");assert.equal(args.homework_id,"synthetic-homework");
    return {data:{id:"synthetic-homework",title:"Photosynthesis",description:"Explain how sunlight and chlorophyll help a plant make food.",subject:"Science",class:"9A",dueOn:"2026-10-07",status:"ACTIVE"}};
  }, "Role: STUDENT. School timezone: Asia/Kolkata. Today's local date: 2026-10-06. This test uses synthetic records only.");
  assert.ok(reads.has("get_my_updates"));assert.ok(reads.has("get_homework"));
  assert.match(reply.text,/plant|sunlight|photosynthesis/i);
  assert.equal(reply.approval,undefined);
  console.log("GEMINI_VERIFY student_updates_homework_ok");
})().catch(error=>{
  console.error("GEMINI_VERIFY failed " + (error.constructor?.name === "AgentError" ? error.message : "response_validation_failed"));
  process.exitCode=1;
});
