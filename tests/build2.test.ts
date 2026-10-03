import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "crypto";
import { ledger } from "../src/lib/fees-calc";
import { brandVars, validColour } from "../src/lib/branding";
import { tr } from "../src/lib/i18n";
import { normalizePhone, waLink } from "../src/lib/alerts";
import { vapidJwt } from "../src/lib/push";

const d = (s: string) => new Date(s);
const items = [
  { id: "a", name: "Term 1", amount: 10000, dueOn: d("2026-06-10"), classId: null },
  { id: "b", name: "Term 2", amount: 8000, dueOn: d("2026-10-10"), classId: null },
];

test("fee ledger: payments reduce the right item, overdue is date-based", () => {
  const l = ledger(items, [{ itemId: "a", amount: 4000 }], d("2026-10-03"));
  assert.equal(l.due, 14000); assert.equal(l.overdue, 6000); assert.equal(l.credit, 0); assert.equal(l.charged, 18000);
});
test("fee ledger: general payments clear oldest dues first and excess becomes credit", () => {
  const l = ledger(items, [{ itemId: null, amount: 12000 }], d("2026-10-03"));
  assert.equal(l.rows[0].balance, 0); assert.equal(l.rows[1].balance, 6000); assert.equal(l.overdue, 0);
  const over = ledger(items, [{ itemId: null, amount: 20000 }], d("2026-10-03"));
  assert.equal(over.due, 0); assert.equal(over.credit, 2000);
});
test("branding colours are validated and produce all shades", () => {
  assert.ok(validColour("#1a2b3c")); assert.ok(!validColour("red")); assert.ok(!validColour("#12"));
  assert.equal(brandVars("javascript:"), null);
  assert.match(brandVars("#112233")!, /--brand-600:17 34 51/); assert.equal(brandVars("#112233")!.split(";").length, 11);
});
test("translations fall back to English", () => {
  assert.equal(tr("en", "Fees"), "Fees"); assert.equal(tr("ml", "no such string xyz"), "no such string xyz");
  assert.notEqual(tr("ml", "Fees"), "Fees"); assert.notEqual(tr("hi", "Fees"), "Fees");
});
test("phone numbers are normalised for WhatsApp", () => {
  assert.equal(normalizePhone("94968 29330"), "919496829330"); assert.equal(normalizePhone("+91 94968-29330"), "919496829330");
  assert.equal(normalizePhone("123"), null); assert.equal(normalizePhone(null), null);
  assert.ok(waLink("919496829330", "a b").endsWith("?text=a%20b"));
});
test("VAPID JWT is a valid ES256 signature over the right claims", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const pj = publicKey.export({ format: "jwk" }) as { x: string; y: string }, kj = privateKey.export({ format: "jwk" }) as { d: string };
  process.env.VAPID_PUBLIC_KEY = Buffer.concat([Buffer.from([4]), Buffer.from(pj.x, "base64url"), Buffer.from(pj.y, "base64url")]).toString("base64url");
  process.env.VAPID_PRIVATE_KEY = kj.d;
  const jwt = vapidJwt("https://fcm.googleapis.com", 1000);
  const [h, b, s] = jwt.split(".");
  assert.ok(verify("sha256", Buffer.from(`${h}.${b}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url")));
  const claims = JSON.parse(Buffer.from(b, "base64url").toString());
  assert.equal(claims.aud, "https://fcm.googleapis.com"); assert.equal(claims.exp, 1000 + 12 * 3600);
});
