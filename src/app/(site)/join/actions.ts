"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";
import { checkLogin } from "@/lib/auth-check";
import { inviteState } from "@/lib/invites";

type State = { error?: string } | undefined;
const EMAIL = /^\S+@\S+\.\S+$/;
const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

/** Atomically spends one use of an invite. Returns false if it was just used up, cancelled or expired. */
async function spend(tx: Pick<typeof db, "invite">, id: string) {
  const r = await tx.invite.updateMany({ where: { id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { uses: { increment: 1 } } });
  if (r.count !== 1) return false;
  const inv = await tx.invite.findUnique({ where: { id } });
  return !!inv && inv.uses <= inv.maxUses;
}

async function signIn(u: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "PARENT"; schoolId: string | null; name: string; email: string }) {
  await createSession({ userId: u.id, role: u.role, schoolId: u.schoolId, name: u.name, email: u.email });
}

// ───────────────────────── Teacher ─────────────────────────
export async function joinAsTeacher(token: string, _: State, fd: FormData): Promise<State> {
  const inv = await db.invite.findUnique({ where: { token }, include: { school: true } });
  if (!inv || inv.kind !== "TEACHER" || inviteState(inv) !== "ok") return { error: "This invite link is no longer valid. Ask your principal for a new one." };
  const name = str(fd, "name", 100), email = str(fd, "email", 200).toLowerCase(), phone = str(fd, "phone", 30), qualification = str(fd, "qualification", 200);
  const password = String(fd.get("password") ?? ""), confirm = String(fd.get("confirm") ?? "");
  const type = str(fd, "type", 10);
  const classTeacherOf = str(fd, "classTeacherOf", 40);
  const subjectIds = [...new Set(fd.getAll("subjectIds").map(String))].slice(0, 30);
  const classIds = [...new Set(fd.getAll("classIds").map(String))].slice(0, 60);
  if (name.length < 2) return { error: "Please enter your full name." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Choose a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };
  if (!["CLASS", "SUBJECT", "BOTH"].includes(type)) return { error: "Choose whether you are a class teacher, a subject teacher or both." };
  const wantsClass = type === "CLASS" || type === "BOTH", wantsSubject = type === "SUBJECT" || type === "BOTH";
  if (wantsClass && !classTeacherOf) return { error: "Choose the class you are the class teacher of." };
  if (wantsSubject && (subjectIds.length === 0 || classIds.length === 0)) return { error: "Choose at least one subject and one class you teach." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email already has an account. Sign in instead, or use a different email." };

  const skipped: string[] = [];
  let created: { id: string; role: "TEACHER"; schoolId: string; name: string; email: string } | null = null;
  try {
    created = await db.$transaction(async (tx) => {
      if (!(await spend(tx, inv.id))) throw new Error("INVITE");
      const user = await tx.user.create({ data: { schoolId: inv.schoolId, email, name, phone: phone || null, role: "TEACHER", passwordHash: await bcrypt.hash(password, 12) } });
      const count = await tx.teacher.count({ where: { schoolId: inv.schoolId } });
      let employeeNo = `T${String(count + 1).padStart(3, "0")}`;
      if (await tx.teacher.findUnique({ where: { schoolId_employeeNo: { schoolId: inv.schoolId, employeeNo } } })) employeeNo += `-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const teacher = await tx.teacher.create({ data: { schoolId: inv.schoolId, userId: user.id, employeeNo, qualification: qualification || null, joinedOn: new Date() } });
      if (wantsClass) {
        const r = await tx.class.updateMany({ where: { id: classTeacherOf, schoolId: inv.schoolId, classTeacherId: null }, data: { classTeacherId: teacher.id } });
        if (r.count !== 1) throw new Error("CLASS");
      }
      if (wantsSubject) {
        const classes = await tx.class.findMany({ where: { id: { in: classIds }, schoolId: inv.schoolId } });
        const subjects = await tx.subject.findMany({ where: { id: { in: subjectIds }, schoolId: inv.schoolId } });
        for (const c of classes) for (const s of subjects) {
          const r = await tx.classSubject.createMany({ data: [{ classId: c.id, subjectId: s.id, teacherId: teacher.id }], skipDuplicates: true });
          if (r.count === 0) skipped.push(`${s.name} (${c.name})`);
        }
      }
      await tx.auditLog.create({ data: { schoolId: inv.schoolId, userId: user.id, action: "teacher_join", entity: inv.id } });
      const admins = await tx.user.findMany({ where: { schoolId: inv.schoolId, role: "ADMIN", active: true }, select: { id: true } });
      if (admins.length) await tx.notification.createMany({ data: admins.map((a) => ({ schoolId: inv.schoolId, userId: a.id, title: `${name} joined as a teacher`, body: skipped.length ? `Already assigned to someone else, so skipped: ${skipped.join(", ")}.` : "Review their classes and give them a position if needed.", link: "/teachers" })) });
      return { id: user.id, role: "TEACHER" as const, schoolId: inv.schoolId, name, email };
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "INVITE") return { error: "This invite link was just used or cancelled. Ask your principal for a new one." };
    if (m === "CLASS") return { error: "Someone else was just made class teacher of that class. Please pick another class." };
    return { error: "Something went wrong creating your account. Please try again." };
  }
  await signIn(created);
  redirect("/dashboard");
}

// ───────────────────────── Parent ─────────────────────────
async function claim(token: string, userId: string): Promise<{ error?: string }> {
  const inv = await db.invite.findUnique({ where: { token } });
  if (!inv || inv.kind !== "PARENT" || !inv.studentId) return { error: "This link isn’t valid." };
  const already = await db.guardian.findUnique({ where: { userId_studentId: { userId, studentId: inv.studentId } } });
  if (already) return {};
  if (inviteState(inv) !== "ok") return { error: "This link has expired, been used by two guardians, or was cancelled. Ask the class teacher for a new one." };
  try {
    await db.$transaction(async (tx) => {
      if (!(await spend(tx, inv.id))) throw new Error("INVITE");
      await tx.guardian.create({ data: { userId, studentId: inv.studentId!, relation: "Parent" } });
      await tx.auditLog.create({ data: { schoolId: inv.schoolId, userId, action: "parent_claim", entity: inv.studentId } });
    });
  } catch { return { error: "This link was just used up. Ask the class teacher for a new one." }; }
  return {};
}

export async function parentRegister(token: string, _: State, fd: FormData): Promise<State> {
  const inv = await db.invite.findUnique({ where: { token } });
  if (!inv || inv.kind !== "PARENT" || inviteState(inv) !== "ok") return { error: "This link is no longer valid. Ask the class teacher for a new one." };
  const name = str(fd, "name", 100), email = str(fd, "email", 200).toLowerCase(), phone = str(fd, "phone", 30);
  const password = String(fd.get("password") ?? ""), confirm = String(fd.get("confirm") ?? "");
  if (name.length < 2) return { error: "Please enter your full name." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Choose a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email already has an account. Use “I already have an account” below to add this child to it." };
  const user = await db.user.create({ data: { schoolId: inv.schoolId, email, name, phone: phone || null, role: "PARENT", passwordHash: await bcrypt.hash(password, 12) } });
  const r = await claim(token, user.id);
  if (r.error) { await db.user.delete({ where: { id: user.id } }); return r; }
  await signIn(user);
  redirect("/dashboard");
}

export async function parentSignIn(token: string, _: State, fd: FormData): Promise<State> {
  const inv = await db.invite.findUnique({ where: { token } });
  if (!inv || inv.kind !== "PARENT") return { error: "This link isn’t valid." };
  const r = await checkLogin(str(fd, "email", 200), String(fd.get("password") ?? ""));
  if ("error" in r) return { error: r.error };
  const u = r.user;
  if (u.role !== "PARENT" || u.schoolId !== inv.schoolId) return { error: "This account can’t be used for this child. Use the parent account for this school." };
  const c = await claim(token, u.id);
  if (c.error) return c;
  await signIn(u);
  redirect("/dashboard");
}

export async function parentClaimLoggedIn(token: string): Promise<void> {
  const s = await getSession();
  if (!s) redirect(`/join/parent/${token}`);
  const u = await db.user.findUnique({ where: { id: s.userId } });
  const inv = await db.invite.findUnique({ where: { token } });
  if (!u || !u.active || u.role !== "PARENT" || !inv || u.schoolId !== inv.schoolId) redirect(`/join/parent/${token}`);
  const c = await claim(token, u.id);
  redirect(c.error ? `/join/parent/${token}?error=${encodeURIComponent(c.error)}` : "/dashboard");
}

// ───────────────────────── Password reset ─────────────────────────
export async function resetPassword(token: string, _: State, fd: FormData): Promise<State> {
  const inv = await db.invite.findUnique({ where: { token }, include: { user: true } });
  if (!inv || inv.kind !== "RESET" || !inv.user || inviteState(inv) !== "ok") return { error: "This reset link is no longer valid. Ask your school for a new one." };
  const password = String(fd.get("password") ?? ""), confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { error: "Choose a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };
  const ok = await db.$transaction(async (tx) => {
    if (!(await spend(tx, inv.id))) return false;
    await tx.user.update({ where: { id: inv.user!.id }, data: { passwordHash: await bcrypt.hash(password, 12), failedLogins: 0, lockedUntil: null, mustChangePassword: false } });
    await tx.auditLog.create({ data: { schoolId: inv.schoolId, userId: inv.user!.id, action: "password_reset" } });
    return true;
  });
  if (!ok) return { error: "This reset link was just used or cancelled." };
  redirect("/login?reset=1");
}
