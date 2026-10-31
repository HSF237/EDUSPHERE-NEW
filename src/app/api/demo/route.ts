import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionJwt } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * One-tap demo sign-in for presentations: opens the demo school as its principal.
 * Only ever signs in this single demo account — never any other user.
 * Remove this file (or set DEMO_LOGIN=off) to disable it.
 */
const DEMO_EMAIL = "principal@lakeview.edu";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (process.env.DEMO_LOGIN === "off") return NextResponse.redirect(new URL("/login", origin));

  const user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user || !user.active) return NextResponse.redirect(new URL("/login", origin));

  await db.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "login", detail: "demo-link" } });

  const signed = await sessionJwt(
    { userId: user.id, role: user.role, schoolId: user.schoolId, name: user.name, email: user.email },
    { hours: 12 },
  );
  const res = NextResponse.redirect(new URL("/dashboard", origin));
  res.cookies.set(SESSION_COOKIE, signed.jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: signed.maxAge,
  });
  return res;
}
