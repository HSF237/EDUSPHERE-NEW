import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireUser } from "./session";

const COOKIE = "es_owner";
const key = () => new TextEncoder().encode((process.env.AUTH_SECRET ?? "") + ":owner");

export const ownerEmails = () => (process.env.OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const ownerConfigured = () => ownerEmails().length > 0 && /^[a-f0-9]{64}$/i.test(process.env.OWNER_CODE_HASH ?? "");
export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export function codeMatches(code: string) {
  const want = process.env.OWNER_CODE_HASH ?? "";
  if (!/^[a-f0-9]{64}$/i.test(want)) return false;
  const a = Buffer.from(sha256(code.trim()), "hex"), b = Buffer.from(want.toLowerCase(), "hex");
  return crypto.timingSafeEqual(a, b);
}

/** Signed-in SUPER_ADMIN whose email is on the owner list. Does not check the code. */
export async function requireOwnerUser() {
  const u = await requireUser(["SUPER_ADMIN"]);
  if (!ownerConfigured() || !ownerEmails().includes(u.email.toLowerCase())) redirect("/dashboard");
  return u;
}

export async function unlockOwner(userId: string) {
  const t = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(key());
  (await cookies()).set(COOKIE, t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7200 });
}
export async function lockOwner() { (await cookies()).delete(COOKIE); }
export async function isUnlocked(userId: string) {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return false;
  try { const { payload } = await jwtVerify(t, key()); return payload.uid === userId; } catch { return false; }
}

/** Owner user + valid unlock. Redirects to the code gate otherwise. */
export async function requireOwner() {
  const u = await requireOwnerUser();
  if (!(await isUnlocked(u.id))) redirect("/owner");
  return u;
}

export async function tooManyFails(userId: string) {
  const n = await db.auditLog.count({ where: { userId, action: "owner_code_fail", createdAt: { gt: new Date(Date.now() - 15 * 60000) } } });
  return n >= 5;
}
