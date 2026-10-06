// Live API verification only: synthetic data, no database or application writes.
const assert = require("node:assert/strict");
const { GeminiProvider, runAgent } = require("../src/lib/ai/provider.ts");
const { TOOLS, validateCall } = require("../src/lib/ai/tools.ts");
const declaration = name => {
  const tool = TOOLS.find(t => t.name === name);
  return { type: "function", name: tool.name, description: tool.description, parameters: tool.parameters };
};
(async () => {
  const provider = new GeminiProvider();
  let prepared = 0;
  const preview = await runAgent(provider,
    "Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D.", [], [declaration("create_classes")], async call => {
      assert.equal(call.name, "create_classes");
      const args = validateCall(call.name, call.arguments);
      assert.deepEqual(args.class_codes, ["8A", "8B", "8C", "8D"]);
      assert.equal(args.academic_year, "active");
      prepared++;
      return { approval: { id: "synthetic-only", fingerprint: "synthetic-only", tool: call.name,
        expiresAt: "synthetic-only", status: "PENDING", changes: args } };
    }, "Role: ADMIN. This is a synthetic test, using synthetic preview handlers only.");
  assert.equal(prepared, 1); assert.ok(preview.approval);
  console.log("GEMINI_VERIFY class_preview_ok");
  let reads = 0;
  const reply = await runAgent(provider,
    "Use get_school_status for today and tell me the school's attendance percentage.", [], [declaration("get_school_status")], async call => {
      assert.equal(call.name, "get_school_status");
      assert.equal(validateCall(call.name, call.arguments).date, "today");
      reads++;
      return { data: { date: "today", attendance: { present: 73, total: 100, percentage: 73 } } };
    }, "Role: ADMIN. All tool handlers return synthetic data for API verification.");
  assert.equal(reads, 1); assert.match(reply.text, /73/);
  console.log("GEMINI_VERIFY tool_continuation_ok");
})().catch(error => {
  console.error("GEMINI_VERIFY failed " + (error.constructor?.name === "AgentError" ? error.message : "response_validation_failed"));
  process.exitCode = 1;
});
