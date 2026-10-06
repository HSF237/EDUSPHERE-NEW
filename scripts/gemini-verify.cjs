// Live API verification only: synthetic data, no database or application writes.
const assert = require("node:assert/strict");
const { GeminiProvider, runAgent } = require("../src/lib/ai/provider.ts");
const { TOOLS, validateCall } = require("../src/lib/ai/tools.ts");
const { batchSchema } = require("../src/lib/ai/operations.ts");
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
  const allTools = TOOLS.filter(t => t.enabled && t.allowedRoles.includes("ADMIN")).map(t => declaration(t.name));
  const context = "Role: ADMIN. School timezone: Asia/Kolkata. Today's local date: 2026-10-06. This is a synthetic API verification. All handlers return synthetic data; no database writes are available.";
  const lookup = async call => {
    assert.equal(call.name, "search_school_records");
    const args = validateCall(call.name, call.arguments);
    const records = args.resource === "classes" ? [{ id: "synthetic-class-9a", name: "9A", grade: 9 }]
      : args.resource === "teachers" ? [{ id: "synthetic-teacher", user_id: "synthetic-user", name: "Teacher One", active: true }]
      : args.resource === "assignments" ? [{ id: "synthetic-assignment", classId: "synthetic-class-9a", teacherId: "synthetic-teacher", teacher: "Teacher One" }] : [];
    return { data: { resource: args.resource, records, totalMatches: records.length, nextOffset: null } };
  };
  let planned = 0;
  const meeting = await runAgent(provider,
    "Schedule a teacher meeting for all teachers assigned to Class IX on 2027-03-01 from 15:00 to 16:00 in the Staff room. Agenda: Review teaching progress. Title: Class IX planning.", [], allTools, async call => {
      if (call.name === "search_school_records") return lookup(call);
      assert.equal(call.name, "prepare_school_actions");
      const args = batchSchema.parse(call.arguments);
      assert.equal(args.actions.length, 1);
      const action = args.actions[0];
      assert.equal(action.action, "schedule_staff_meeting");
      assert.equal(action.date, "2027-03-01"); assert.equal(action.start_time, "15:00"); assert.equal(action.end_time, "16:00");
      assert.equal(action.venue, "Staff room"); assert.deepEqual(action.class_ids, ["synthetic-class-9a"]);
      assert.ok(action.teacher_ids.every(id => id === "synthetic-teacher"));
      planned++;
      return { approval: { id: "synthetic-meeting", fingerprint: "synthetic", tool: call.name, expiresAt: "synthetic", status: "PENDING", changes: {} } };
    }, context);
  assert.equal(planned, 1); assert.ok(meeting.approval);
  console.log("GEMINI_VERIFY expanded_meeting_preview_ok");
  const clarification = await runAgent(provider, "Schedule a meeting for teachers of Class IX.", [], allTools, async call => {
    assert.notEqual(call.name, "prepare_school_actions", "Missing dates/times must not produce a proposal");
    return lookup(call);
  }, context);
  assert.match(clarification.text, /date|time|when/i);
  assert.doesNotMatch(clarification.text, /(?:cannot|can't|unable to|do not have).*schedul/i);
  console.log("GEMINI_VERIFY missing_details_clarification_ok");
})().catch(error => {
  console.error("GEMINI_VERIFY failed " + (error.constructor?.name === "AgentError" ? error.message : "response_validation_failed"));
  process.exitCode = 1;
});
