// One-time rollout: verify schema/history and Gemini without exposing secrets or school data.
const { PrismaClient } = require("@prisma/client");
const { readdirSync, readFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { GeminiProvider } = require("../src/lib/ai/provider.ts");
const db = new PrismaClient();
const current = "20261012000000_gemini_copilot";
const allowBaseline = process.env.COPILOT_ALLOW_VERIFIED_BASELINE === "1";
function prisma(args) {
  return spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...args], {
    env: process.env, encoding: "utf8", timeout: 60000, maxBuffer: 2000000
  });
}
function verifyExistingSchema() {
  const result = prisma(["migrate", "diff", "--from-schema-datasource", "prisma/schema.prisma",
    "--to-schema-datamodel", "prisma/baselines/pre_copilot.prisma", "--exit-code"]);
  if (result.status === 2) {
    // Diff summaries contain schema structure, not database records or credentials.
    console.log("ROLLOUT_SCHEMA_DIFF " + result.stdout.slice(0, 8000));
    throw new Error("BASELINE_SCHEMA_MISMATCH");
  }
  if (result.status !== 0) throw new Error("BASELINE_SCHEMA_CHECK_FAILED");
  console.log("ROLLOUT_BASELINE_SCHEMA_MATCH");
}
(async () => {
  const found = await db.$queryRawUnsafe('SELECT to_regclass(\'"_prisma_migrations"\')::text AS name');
  const history = found[0]?.name
    ? await db.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"')
    : [];
  const expected = new Map(readdirSync("prisma/migrations", { withFileTypes: true }).filter(d => d.isDirectory()).map(d => [
    d.name, createHash("sha256").update(readFileSync("prisma/migrations/" + d.name + "/migration.sql")).digest("hex")
  ]));
  const applied = new Set();
  for (const row of history) {
    if (row.rolled_back_at) continue;
    if (!row.finished_at) throw new Error("UNFINISHED_MIGRATION");
    if (!expected.has(row.migration_name)) throw new Error("UNKNOWN_MIGRATION");
    if (expected.get(row.migration_name) !== row.checksum) throw new Error("MIGRATION_CHECKSUM_MISMATCH");
    applied.add(row.migration_name);
  }
  const pending = [...expected.keys()].filter(n => !applied.has(n));
  const baselinePending = pending.filter(n => n !== current);
  console.log("ROLLOUT_MIGRATIONS " + JSON.stringify({ applied: applied.size, pending }));
  if (baselinePending.length) {
    if (!allowBaseline) throw new Error(found[0]?.name ? "UNEXPECTED_PENDING_MIGRATIONS" : "MIGRATION_HISTORY_MISSING");
    verifyExistingSchema();
  }
  const turn = await new GeminiProvider().generate(
    [{ type: "user_input", content: [{ type: "text", text: "Reply with exactly EDUSPHERE_GEMINI_OK." }] }],
    "Return the requested verification token only.", []
  );
  if (turn.calls.length || !turn.text.includes("EDUSPHERE_GEMINI_OK")) throw new Error("GEMINI_VERIFICATION_RESPONSE_INVALID");
  console.log("ROLLOUT_GEMINI_OK " + (process.env.GEMINI_MODEL || "gemini-3.8-flash"));
  if (baselinePending.length) {
    verifyExistingSchema();
    for (const name of baselinePending.sort()) {
      const result = prisma(["migrate", "resolve", "--applied", name]);
      if (result.status !== 0) throw new Error("BASELINE_RECORD_FAILED");
      console.log("ROLLOUT_BASELINE_RECORDED " + name);
    }
  }
})().catch(e => {
  const safe = e.code || e.errorCode || (/^[A-Z_]+$/.test(e.message || "") ? e.message : e.name === "AgentError" ? e.message : "UNEXPECTED_PREFLIGHT_FAILURE");
  console.error("ROLLOUT_PREFLIGHT_FAILED " + safe);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
