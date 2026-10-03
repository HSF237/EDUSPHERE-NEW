"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function forcePasswordChange(_: { error?: string } | undefined, fd: FormData) {
  const u = await requireUser();
  const next = String(fd.get("next") ?? ""), confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: "Use at least 8 characters." };
  if (next !== confirm) return { error: "The two passwords don’t match." };
  if (await bcrypt.compare(next, u.passwordHash)) return { error: "Choose a password different from the temporary one." };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 12), mustChangePassword: false } });
  await db.auditLog.create({ data: { schoolId: u.schoolId, userId: u.id, action: "password_change" } });
  redirect("/dashboard");
}
