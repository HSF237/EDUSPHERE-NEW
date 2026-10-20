import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "es_session";
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
};

export type Session = {
  userId: string;
  role: Role;
  schoolId: string | null;
  name: string;
  email: string;
  /** Set only while the platform owner is in support mode: the owner's own user id. */
  sup?: string;
};

export async function sessionJwt(s: Session, opts?: { hours?: number }): Promise<{ jwt: string; maxAge: number }> {
  const hours = opts?.hours ?? 24 * 7;
  const jwt = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret());
  return { jwt, maxAge: 60 * 60 * hours };
}

export async function createSession(s: Session, opts?: { hours?: number }) {
  const signed = await sessionJwt(s, opts);
  const c = await cookies();
  c.set(SESSION_COOKIE, signed.jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: signed.maxAge,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Require a signed-in, still-active user. Re-checks DB so disabled users lose access. */
export async function requireUser(roles?: Role[]) {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await db.user.findUnique({
    where: { id: s.userId },
    include: { school: true, teacher: true },
  });
  if (!user || !user.active) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}
