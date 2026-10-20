import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionJwt } from "@/lib/session";
import { consumeOAuthTxn, emailIsVerified, exchangeCode, providerConfig, verifyIdToken } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/**
 * OAuth callback. Signs in an existing EduSphere account whose verified email
 * matches; never creates accounts, and binds the provider subject on first use
 * so a later email change cannot take over the account.
 */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?oauth=${code}`, url.origin));

  const c = providerConfig(provider);
  if (!c) return fail("not-configured");

  const providerError = url.searchParams.get("error");
  if (providerError) return fail(providerError === "access_denied" ? "denied" : "failed");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return fail("failed");

  const verifier = await consumeOAuthTxn(provider, state);
  if (!verifier) return fail("expired");

  const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
  const idToken = await exchangeCode(c, code, redirectUri, verifier);
  if (!idToken) return fail("failed");

  const claims = await verifyIdToken(c, idToken);
  if (!claims) return fail("failed");
  if (!claims.email || !emailIsVerified(claims.email_verified)) return fail("email-unverified");

  const email = claims.email.trim().toLowerCase();
  const subject = `${provider}:${claims.sub}`;

  let user = await db.user.findUnique({ where: { oauthSub: subject } });
  if (!user) {
    const byEmail = await db.user.findUnique({ where: { email } });
    if (!byEmail) return fail("no-account");
    // The email already belongs to an account linked to another identity.
    if (byEmail.oauthSub && byEmail.oauthSub !== subject) return fail("linked-elsewhere");
    user = await db.user.update({ where: { id: byEmail.id }, data: { oauthSub: subject } });
  }

  if (!user.active) return fail("inactive");
  if (user.lockedUntil && user.lockedUntil > new Date()) return fail("locked");

  if (user.role === "STUDENT") {
    const enrolled = await db.student.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId ?? "",
        active: true,
        school: { active: true },
        class: { schoolId: user.schoolId ?? "" },
      },
      select: { id: true },
    });
    if (!enrolled) return fail("inactive");
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  await db.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "login_oauth", detail: provider } });

  const signed = await sessionJwt({ userId: user.id, role: user.role, schoolId: user.schoolId, name: user.name, email: user.email });
  const res = NextResponse.redirect(new URL("/dashboard", url.origin));
  res.cookies.set(SESSION_COOKIE, signed.jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: signed.maxAge,
  });
  return res;
}
