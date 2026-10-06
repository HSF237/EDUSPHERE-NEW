// One-time production rollout check. Prints status metadata, never credentials or school data.
const { PrismaClient } = require("@prisma/client");
const { readdirSync, readFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { GeminiProvider } = require("../src/lib/ai/provider.ts");
const db = new PrismaClient();
(async () => {
  const found = await db.$queryRawUnsafe('SELECT to_regclass(\'"_prisma_migrations"\')::text AS name');
  if (!found[0]?.name) throw new Error("MIGRATION_HISTORY_MISSING");
  const history = await db.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
  const expected = new Map(readdirSync("prisma/migrations", { withFileTypes: true }).filter(d => d.isDirectory()).map(d => [
    d.name, createHash("sha256").update(readFileSync("prisma/migrations/" + d.name + "/migration.sql")).digest("hex")
  ]));
  const applied = new Set();
  for (const row of history) {
    if (row.rolled_back_at) continue;
    if (!row.finished_at) throw new Error("UNFINISHED_MIGRATION_" + row.migration_name);
    if (!expected.has(row.migration_name)) throw new Error("UNKNOWN_MIGRATION_" + row.migration_name);
    if (expected.get(row.migration_name) !== row.checksum) throw new Error("MIGRATION_CHECKSUM_MISMATCH_" + row.migration_name);
    applied.add(row.migration_name);
  }
  const pending = [...expected.keys()].filter(n => !applied.has(n));
  console.log("ROLLOUT_MIGRATIONS " + JSON.stringify({ applied: applied.size, pending }));
  if (pending.some(n => n !== "20261012000000_gemini_copilot")) throw new Error("UNEXPECTED_PENDING_MIGRATIONS");
  const turn = await new GeminiProvider().generate(
    [{ type: "user_input", content: [{ type: "text", text: "Reply with exactly EDUSPHERE_GEMINI_OK." }] }],
    "Return the requested verification token only.", []
  );
  if (turn.calls.length || !turn.text.includes("EDUSPHERE_GEMINI_OK")) throw new Error("GEMINI_VERIFICATION_RESPONSE_INVALID");
  console.log("ROLLOUT_GEMINI_OK " + (process.env.GEMINI_MODEL || "gemini-3.8-flash"));
})().catch(e => {
  const safe = e.code || e.errorCode || (/^(MIGRATION_|UNEXPECTED_|UNFINISHED_|UNKNOWN_MIGRATION_|GEMINI_)[A-Za-z0-9_]*$/.test(e.message || "") ? e.message : e.name === "AgentError" ? e.message : "UNEXPECTED_PREFLIGHT_FAILURE");
  console.error("ROLLOUT_PREFLIGHT_FAILED " + safe);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
