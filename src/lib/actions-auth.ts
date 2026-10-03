"use server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createSession, destroySession } from "./session";
import { checkLogin } from "./auth-check";

export async function loginAction(_: { error?: string } | undefined, fd: FormData) {
  const r = await checkLogin(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  if ("error" in r) return { error: r.error };
  const u = r.user;
  await db.auditLog.create({ data: { schoolId: u.schoolId, userId: u.id, action: "login" } });
  await createSession({ userId: u.id, role: u.role, schoolId: u.schoolId, name: u.name, email: u.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
