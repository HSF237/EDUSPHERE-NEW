"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { DAY, joinPath, newToken } from "@/lib/invites";

export async function createTeacherInvite(): Promise<{ error?: string; path?: string }> {
  const ctx = await getCtx();
  if (!can(ctx, "TEACHERS")) return { error: "You don’t have permission to invite teachers." };
  const [classCount, subjectCount] = await Promise.all([db.class.count({ where: { schoolId: ctx.schoolId } }), db.subject.count({ where: { schoolId: ctx.schoolId } })]);
  if (classCount === 0 || subjectCount === 0) return { error: `Before inviting teachers, add your ${classCount === 0 ? "classes" : ""}${classCount === 0 && subjectCount === 0 ? " and " : ""}${subjectCount === 0 ? "subjects" : ""} under Classes & subjects. Teachers choose their class and subject from those when they sign up.` };
  const open = await db.invite.count({ where: { schoolId: ctx.schoolId, kind: "TEACHER", revokedAt: null, uses: 0, expiresAt: { gt: new Date() } } });
  if (open >= 100) return { error: "You already have 100 unused invite links. Cancel some first." };
  const inv = await db.invite.create({ data: { token: newToken(), kind: "TEACHER", schoolId: ctx.schoolId, createdById: ctx.user.id, maxUses: 1, expiresAt: new Date(Date.now() + 7 * DAY) } });
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "teacher_invite_create", entity: inv.id } });
  revalidatePath("/teachers");
  return { path: joinPath("TEACHER", inv.token) };
}

export async function revokeInvite(id: string) {
  const ctx = await getCtx();
  if (!can(ctx, "TEACHERS")) return;
  await db.invite.updateMany({ where: { id, schoolId: ctx.schoolId, revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/teachers");
}

/** Reset link for a teacher (principal / TEACHERS permission), or for a principal (platform admin). */
export async function createResetLink(userId: string): Promise<{ error?: string; path?: string }> {
  const ctx = await getCtx();
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target?.schoolId) return { error: "Account not found." };
  const allowed =
    (ctx.role === "SUPER_ADMIN" && target.role === "ADMIN") ||
    (target.schoolId === ctx.schoolId && target.role === "TEACHER" && can(ctx, "TEACHERS")) ||
    (target.schoolId === ctx.schoolId && target.role === "PARENT" && (ctx.role === "ADMIN" || can(ctx, "STUDENTS") || (ctx.role === "TEACHER" && ctx.mode === "CLASS" && (await db.guardian.count({ where: { userId, student: { classId: { in: ctx.classIds } } } })) > 0)));
  if (!allowed) return { error: "You can’t reset this account." };
  await db.invite.updateMany({ where: { userId, kind: "RESET", revokedAt: null }, data: { revokedAt: new Date() } });
  const inv = await db.invite.create({ data: { token: newToken(), kind: "RESET", schoolId: target.schoolId, createdById: ctx.user.id, userId, maxUses: 1, expiresAt: new Date(Date.now() + 2 * DAY) } });
  await db.auditLog.create({ data: { schoolId: target.schoolId, userId: ctx.user.id, action: "reset_link_create", entity: userId } });
  return { path: joinPath("RESET", inv.token) };
}
