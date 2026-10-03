import { createPrivateKey, sign } from "crypto";
import { db } from "./db";

/** Web Push without extra packages: VAPID-signed "wake up" pushes with no payload; the service worker then fetches the latest notification. */
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
export const pushConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export function vapidJwt(audience: string, now = Math.floor(Date.now() / 1000)) {
  const pub = Buffer.from(process.env.VAPID_PUBLIC_KEY!, "base64url");
  const key = createPrivateKey({ format: "jwk", key: { kty: "EC", crv: "P-256", d: process.env.VAPID_PRIVATE_KEY!, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } });
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64u(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: process.env.VAPID_SUBJECT || "mailto:admin@example.com" }));
  const sig = sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${b64u(sig)}`;
}

export async function pushToUsers(userIds: string[]) {
  if (!pushConfigured() || !userIds.length) return;
  const subs = await db.pushSub.findMany({ where: { userId: { in: userIds } }, take: 500 });
  await Promise.allSettled(subs.map(async (s) => {
    try {
      const aud = new URL(s.endpoint).origin;
      const r = await fetch(s.endpoint, { method: "POST", headers: { TTL: "3600", Urgency: "normal", "Content-Length": "0", Authorization: `vapid t=${vapidJwt(aud)}, k=${process.env.VAPID_PUBLIC_KEY}` }, signal: AbortSignal.timeout(4000) });
      if (r.status === 404 || r.status === 410) await db.pushSub.delete({ where: { id: s.id } }).catch(() => {});
    } catch { /* offline devices are skipped */ }
  }));
}
