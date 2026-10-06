import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

const source = fs.readFileSync("scripts/copilot-preflight.cjs", "utf8");
const names = fs.readdirSync("prisma/migrations", { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const current = "20261012000000_gemini_copilot";
const rows = names.filter(n => n !== current).map(n => ({ migration_name: n,
  checksum: crypto.createHash("sha256").update(fs.readFileSync(`prisma/migrations/${n}/migration.sql`)).digest("hex"),
  finished_at: new Date(), rolled_back_at: null }));

async function run(options: { allow?: boolean; history?: typeof rows; diff?: number; geminiFails?: boolean }) {
  const events: string[] = [];
  const logs: string[] = [];
  const processState = { execPath: process.execPath, env: { COPILOT_ALLOW_VERIFIED_BASELINE: options.allow ? "1" : "0" }, exitCode: 0 };
  const db = { $queryRawUnsafe: async (sql: string) => sql.includes("to_regclass")
    ? [{ name: options.history ? "_prisma_migrations" : null }] : options.history,
    $disconnect: async () => {} };
  const modules: Record<string, unknown> = {
    "@prisma/client": { PrismaClient: class { constructor() { return db; } } },
    "node:fs": fs, "node:crypto": crypto,
    "node:child_process": { spawnSync: (_: string, args: string[]) => {
      const diff = args.includes("diff");
      events.push(diff ? "diff" : `resolve:${args.at(-1)}`);
      return { status: diff ? options.diff ?? 0 : 0, stdout: "schema summary" };
    } },
    "../src/lib/ai/provider.ts": { GeminiProvider: class { async generate() {
      events.push("gemini");
      if (options.geminiFails) throw new Error("sensitive upstream detail");
      return { calls: [], text: "EDUSPHERE_GEMINI_OK" };
    } } }
  };
  await vm.runInNewContext(source, { require: (name: string) => {
    if (!(name in modules)) throw new Error("Unexpected module");
    return modules[name];
  }, process: processState, console: { log: (s: string) => logs.push(s), error: (s: string) => logs.push(s) } });
  return { events, logs, code: processState.exitCode };
}

test("missing history requires the explicit verified-baseline flag", async () => {
  const result = await run({});
  assert.equal(result.code, 1);
  assert.deepEqual(result.events, []);
  assert.match(result.logs.join("\n"), /MIGRATION_HISTORY_MISSING/);
});

test("schema mismatch prevents baseline writes and Gemini requests", async () => {
  const result = await run({ allow: true, diff: 2 });
  assert.equal(result.code, 1);
  assert.deepEqual(result.events, ["diff"]);
  assert.match(result.logs.join("\n"), /BASELINE_SCHEMA_MISMATCH/);
});

test("Gemini failure prevents baseline writes and hides raw error details", async () => {
  const result = await run({ allow: true, geminiFails: true });
  assert.equal(result.code, 1);
  assert.deepEqual(result.events, ["diff", "gemini"]);
  assert.doesNotMatch(result.logs.join("\n"), /sensitive upstream detail/);
});

test("verified baseline records only historical migrations after both schema checks and Gemini", async () => {
  const result = await run({ allow: true });
  assert.equal(result.code, 0);
  assert.deepEqual(result.events.slice(0, 3), ["diff", "gemini", "diff"]);
  assert.deepEqual(result.events.slice(3), names.filter(n => n !== current).sort().map(n => `resolve:${n}`));
  assert.ok(!result.events.includes(`resolve:${current}`));
});

test("valid history needs no baseline operations", async () => {
  const result = await run({ history: rows });
  assert.equal(result.code, 0);
  assert.deepEqual(result.events, ["gemini"]);
});

test("a checksum mismatch stops before any API request or baseline write", async () => {
  const result = await run({ allow: true, history: rows.map((r, i) => i === 0 ? { ...r, checksum: "wrong" } : r) });
  assert.equal(result.code, 1);
  assert.deepEqual(result.events, []);
  assert.match(result.logs.join("\n"), /MIGRATION_CHECKSUM_MISMATCH/);
});
