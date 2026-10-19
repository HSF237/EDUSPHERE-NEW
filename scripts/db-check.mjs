#!/usr/bin/env node
/**
 * Verify a PostgreSQL target before deploying EduSphere.
 *
 * Usage:
 *   $env:DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
 *   node scripts/db-check.mjs
 *
 * Reports: reachability, server version, applied vs pending Prisma migrations,
 * table count and whether seed users exist. Never prints the password.
 * Exit codes: 0 ready, 1 reachable but not ready, 2 bad config/unreachable.
 */
import { PrismaClient } from "@prisma/client";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is not set.");
  process.exit(2);
}

// Redact the password, keep enough to identify the target.
const target = raw.replace(/:\/\/([^:/@]+):([^@]*)@/, "://$1:***@");

// Bound the wait so a wrong host fails fast instead of hanging a deploy.
let url = raw;
if (!/[?&]connect_timeout=/.test(url)) {
  url += (url.includes("?") ? "&" : "?") + "connect_timeout=10";
}

const prisma = new PrismaClient({ datasourceUrl: url });
const fail = (msg, code = 2) => {
  console.error(`\n✗ ${msg}`);
  process.exit(code);
};

console.log(`Target: ${target}\n`);

let version;
try {
  const rows = await prisma.$queryRawUnsafe("SELECT version() AS v");
  version = rows[0].v;
} catch (e) {
  const msg = String(e?.message ?? e ?? "");
  let code = e?.errorCode ?? msg.match(/P\d{4}/)?.[0] ?? "";
  // Prisma sometimes omits errorCode on initialization failures; classify by message.
  if (!code) {
    if (/Can't reach database server|ECONNREFUSED|ENOTFOUND/i.test(msg)) code = "P1001";
    else if (/Authentication failed|password authentication/i.test(msg)) code = "P1000";
    else if (/timed out|ETIMEDOUT/i.test(msg)) code = "P1002";
  }
  const hints = {
    P1001: "Host unreachable — check the host/port, the provider's IP allowlist and that the database is running.",
    P1000: "Authentication failed — check user, password and database name.",
    P1002: "Connection timed out — likely a firewall or IP allowlist.",
    P1010: "Access denied for this user/database.",
  };
  const detail = hints[code] ?? msg.split("\n").filter(Boolean).slice(-2).join(" ");
  fail(`${detail}${code ? ` (${code})` : ""}`);
}

console.log(`✓ Connected: ${version.split(",")[0]}`);

let tables = 0;
try {
  const t = await prisma.$queryRawUnsafe(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'",
  );
  tables = t[0].n;
} catch {
  /* non-fatal */
}
console.log(`  Public tables: ${tables}`);

// Migration state: compare what Prisma recorded against what is checked in.
const dir = join(process.cwd(), "prisma", "migrations");
let local = [];
try {
  local = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
} catch {
  fail(`No prisma/migrations directory at ${dir} — run this from the repo root.`);
}

let appliedRows = [];
try {
  appliedRows = await prisma.$queryRawUnsafe(
    "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at",
  );
} catch {
  console.log("  No _prisma_migrations table yet — this database has never been migrated.");
}

const applied = new Set(
  appliedRows.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => r.migration_name),
);
const failed = appliedRows.filter((r) => !r.finished_at && !r.rolled_back_at);
const pending = local.filter((m) => !applied.has(m));

console.log(`  Migrations applied: ${applied.size}/${local.length}`);
if (pending.length) console.log(`  Pending: ${pending.join(", ")}`);
if (failed.length) console.log(`  ⚠ Unfinished/failed: ${failed.map((f) => f.migration_name).join(", ")}`);

let users = null;
if (tables > 0 && applied.has(local[0])) {
  try {
    const u = await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "User"');
    users = u[0].n;
  } catch {
    /* table shape may differ */
  }
}
if (users !== null) console.log(`  Users in database: ${users}`);

await prisma.$disconnect();

const ready = pending.length === 0 && failed.length === 0 && applied.size === local.length;
if (!ready) {
  console.log("\n→ Not ready. Apply with: npx prisma migrate deploy");
  process.exit(1);
}
console.log("\n✓ Database is fully migrated and ready for the app.");
