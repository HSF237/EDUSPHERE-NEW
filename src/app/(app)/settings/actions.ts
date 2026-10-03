"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";

export async function changePassword(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await getCtx();
  const cur = String(fd.get("current") ?? ""); const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  const u = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!(await bcrypt.compare(cur, u.passwordHash))) return { error: "Current password is incorrect." };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  await db.auditLog.create({ data: { schoolId: u.schoolId, userId: u.id, action: "password_change" } });
  return { ok: true };
}

