import { test } from "node:test";
import assert from "node:assert/strict";
import { pageKey, PAGE_KEY_RE, keyedHref, stripKey } from "../src/lib/pagekey";
import { newToken, inviteState } from "../src/lib/invites";

const S = "x".repeat(40);
test("page keys have the documented shape and are stable", async () => {
  const a = await pageKey("user1", "classes", S);
  assert.match(a, PAGE_KEY_RE);
  assert.equal(a, await pageKey("user1", "classes", S));
});
test("keys differ per user, per section and per secret", async () => {
  const a = await pageKey("user1", "classes", S);
  assert.notEqual(a, await pageKey("user2", "classes", S));
  assert.notEqual(a, await pageKey("user1", "students", S));
  assert.notEqual(a, await pageKey("user1", "classes", "y".repeat(40)));
});
test("keyedHref/stripKey round-trip", async () => {
  const h = await keyedHref("u", "/students", S);
  assert.match(h, /^\/students\/\d{11}[a-z]{8}[A-Z]{3}$/);
  assert.equal(stripKey(h), "/students");
  assert.equal(stripKey(h + "/abc"), "/students/abc");
  assert.equal(await keyedHref("u", "/students/abc", S), "/students/abc");
});
test("invite tokens are long and unique", () => {
  const set = new Set(Array.from({ length: 500 }, newToken));
  assert.equal(set.size, 500);
  for (const t of set) assert.match(t, /^[A-Za-z0-9_-]{32}$/);
});
test("inviteState covers expiry, use-up and revoke", () => {
  const f = new Date(Date.now() + 1e6), p = new Date(Date.now() - 1e6);
  assert.equal(inviteState({ expiresAt: f, uses: 0, maxUses: 1, revokedAt: null }), "ok");
  assert.equal(inviteState({ expiresAt: p, uses: 0, maxUses: 1, revokedAt: null }), "expired");
  assert.equal(inviteState({ expiresAt: f, uses: 1, maxUses: 1, revokedAt: null }), "used");
  assert.equal(inviteState({ expiresAt: f, uses: 0, maxUses: 1, revokedAt: new Date() }), "revoked");
});
