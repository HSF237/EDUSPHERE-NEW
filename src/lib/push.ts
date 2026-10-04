import { createECDH, createCipheriv, createPrivateKey, hkdfSync, randomBytes, sign } from "crypto";
import { kindOf, parsePrefs, wantsAlert } from "./notif";
import { db } from "./db";

/** Web Push without extra packages: VAPID-signed, end-to-end encrypted (RFC 8291) pushes that carry the notification text itself. */
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

/** RFC 8291 "aes128gcm" encryption of a push payload for one browser subscription. */
export function encryptPayload(p256dh: string, auth: string, payload: Buffer) {
  const ua = Buffer.from(p256dh, "base64url"), authSecret = Buffer.from(auth, "base64url");
  const ecdh = createECDH("prime256v1");
  const asPub = ecdh.generateKeys();
  const shared = ecdh.computeSecret(ua);
  const prk = Buffer.from(hkdfSync("sha256", shared, authSecret, Buffer.concat([Buffer.from("WebPush: info\0"), ua, asPub]), 32));
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", prk, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", prk, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const c = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([payload, Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, body]);
}

export type PushMsg = { title: string; body?: string; link?: string };

/** Sends to every device of the given users who haven't muted this kind of alert or set quiet hours. */
export async function pushToUsers(userIds: string[], msg: PushMsg) {
  if (!pushConfigured() || !userIds.length) return;
  const kind = kindOf(msg.link);
  const prefs = new Map((await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, notifPrefs: true } })).map((u) => [u.id, parsePrefs(u.notifPrefs)]));
  const now = new Date();
  const ok = userIds.filter((id) => wantsAlert(prefs.get(id) ?? parsePrefs(null), kind, now));
  if (!ok.length) return;
  const payload = Buffer.from(JSON.stringify({ title: msg.title.slice(0, 80), body: (msg.body ?? "").slice(0, 160), link: msg.link || "/notifications", tag: msg.link || "es" }));
  const subs = await db.pushSub.findMany({ where: { userId: { in: ok } }, take: 500 });
  await Promise.allSettled(subs.map(async (s) => {
    try {
      const aud = new URL(s.endpoint).origin;
      const r = await fetch(s.endpoint, { method: "POST", headers: { TTL: "86400", Urgency: "normal", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", Authorization: `vapid t=${vapidJwt(aud)}, k=${process.env.VAPID_PUBLIC_KEY}` }, body: new Uint8Array(encryptPayload(s.p256dh, s.auth, payload)), signal: AbortSignal.timeout(4000) });
      if (r.status === 404 || r.status === 410) await db.pushSub.delete({ where: { id: s.id } }).catch(() => {});
    } catch { /* offline devices are skipped */ }
  }));
}
