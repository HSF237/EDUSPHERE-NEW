import bcrypt from "bcryptjs";
import { db } from "./db";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

/** Password check with brute-force lockout, shared by the login form and the "sign in to add my child" form. */
export async function checkLogin(emailRaw: string, password: string): Promise<{ user: NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>> } | { error: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || !password) return { error: "Enter a valid email and password." };
  const u = await db.user.findUnique({ where: { email } });
  if (u?.lockedUntil && u.lockedUntil > new Date()) {
    const mins = Math.max(1, Math.ceil((u.lockedUntil.getTime() - Date.now()) / 60000));
    return { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or ask your school for a password reset link.` };
  }
  const ok = u && u.active && (await bcrypt.compare(password, u.passwordHash));
  if (!u || !ok) {
    if (u) {
      const fails = u.failedLogins + 1;
      await db.user.update({ where: { id: u.id }, data: fails >= MAX_FAILS ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } : { failedLogins: fails } });
    }
    return { error: "Incorrect email or password." };
  }
  await db.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  return { user: u };
}
