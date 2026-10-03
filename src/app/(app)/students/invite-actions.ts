"use server";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds, can } from "@/lib/scope";
import { DAY, joinPath, newToken } from "@/lib/invites";

async function allowedClassIds() {
  const ctx = await getCtx();
  if (ctx.role === "PARENT" || ctx.role === "SUPER_ADMIN") return { ctx, ids: [] as string[] };
  if (ctx.role === "TEACHER" && ctx.mode !== "CLASS" && !can(ctx, "STUDENTS")) return { ctx, ids: [] as string[] };
  return { ctx, ids: await scopeClassIds(ctx, "STUDENTS") };
}

/** One secret link per child. Re-uses a still-valid link so the teacher always gets the same one back. */
async function linkFor(schoolId: string, createdById: string, studentId: string) {
  const now = new Date();
  const existing = await db.invite.findFirst({ where: { studentId, kind: "PARENT", revokedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" } });
  if (existing && existing.uses < existing.maxUses) return existing.token;
  const inv = await db.invite.create({ data: { token: newToken(), kind: "PARENT", schoolId, createdById, studentId, maxUses: 2, expiresAt: new Date(Date.now() + 30 * DAY) } });
  return inv.token;
}

export async function parentLink(studentId: string): Promise<{ error?: string; path?: string }> {
  const { ctx, ids } = await allowedClassIds();
  const st = await db.student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId, classId: { in: ids }, active: true } });
  if (!st) return { error: "You can’t create a link for this student." };
  const token = await linkFor(ctx.schoolId, ctx.user.id, st.id);
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "parent_link_create", entity: st.id } });
  return { path: joinPath("PARENT", token) };
}

/** Links for every student in the chosen class (max 300 at a time). */
export async function bulkParentLinks(classId: string): Promise<{ error?: string; items?: { label: string; path: string }[] }> {
  const { ctx, ids } = await allowedClassIds();
  if (!ids.includes(classId)) return { error: "Choose one of your classes first." };
  const students = await db.student.findMany({ where: { schoolId: ctx.schoolId, classId, active: true }, orderBy: { rollNo: "asc" }, take: 300, include: { class: true } });
  const items: { label: string; path: string }[] = [];
  for (const s of students) items.push({ label: `${s.rollNo}. ${s.name} (${s.class.name})`, path: joinPath("PARENT", await linkFor(ctx.schoolId, ctx.user.id, s.id)) });
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "parent_links_bulk", entity: classId } });
  return { items };
}
