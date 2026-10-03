"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createSession, destroySession } from "./session";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function loginAction(_: { error?: string } | undefined, fd: FormData) {
  const p = schema.safeParse({ email: String(fd.get("email") ?? "").trim().toLowerCase(), password: fd.get("password") });
  if (!p.success) return { error: "Enter a valid email and password." };
  const u = await db.user.findUnique({ where: { email: p.data.email } });
  const ok = u && u.active && (await bcrypt.compare(p.data.password, u.passwordHash));
  if (!u || !ok) return { error: "Incorrect email or password." };
  await db.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
  await db.auditLog.create({ data: { schoolId: u.schoolId, userId: u.id, action: "login" } });
  await createSession({ userId: u.id, role: u.role, schoolId: u.schoolId, name: u.name, email: u.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
