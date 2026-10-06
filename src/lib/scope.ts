import { pushToUsers } from "./push";
import { db } from "./db";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUser, getSession } from "./session";
import { accessOf, isReadOnly } from "./billing";
import { studentPageAllowed } from "./student-access";
import type { Perm } from "./perms";

export const WORKSPACE_COOKIE = "es_class";
export type Workspace = { id: string; name: string; mode: "CLASS" | "SUBJECT"; subjects: string[] };

export type Ctx = Awaited<ReturnType<typeof getCtx>>;

/** Resolves the signed-in user plus what they are allowed to see. Every page/action starts here. */
const gate = cache(() => ({ done: false }));

/**
 * `allowLocked` lets billing/export/password actions run on a read-only (unpaid) school.
 * Enforcement runs once per request, on the first call, which for a server action is the action itself.
 */
export async function getCtx(opts?: { allowLocked?: boolean; allowStudent?: boolean }) {
  const user = await requireUser();
  const sess = await getSession();
  const support = !!sess?.sup;
  const access = user.school ? accessOf(user.school) : null;
  const g = gate();
  if (!g.done) {
    g.done = true;
    const isAction = !!(await headers()).get("next-action");
    if (isAction) {
      if (support) redirect("/dashboard?viewonly=1");
      if (user.role !== "SUPER_ADMIN" && access && isReadOnly(access.state) && !opts?.allowLocked) redirect("/billing?locked=1");
    }
  }
  if (user.role === "STUDENT") {
    const h = await headers();
    if (h.get("next-action") ? !opts?.allowStudent : !opts?.allowStudent && !studentPageAllowed(h.get("x-es-path") ?? "")) redirect("/dashboard");
    const student = await db.student.findFirst({ where: { userId: user.id, schoolId: user.schoolId ?? "", active: true, class: { schoolId: user.schoolId ?? "" } }, select: { id: true } });
    if (!student || !user.school?.active) redirect("/login");
  }
  const schoolId = user.schoolId;
  let classIds: string[] = [];
  let childIds: string[] = [];
  let workspaces: Workspace[] = [];
  let active: Workspace | null = null;
  if (schoolId) {
    if (user.role === "ADMIN") {
      classIds = (await db.class.findMany({ where: { schoolId }, select: { id: true } })).map((c) => c.id);
    } else if (user.role === "TEACHER" && user.teacher) {
      const t = user.teacher.id;
      const rows = await db.class.findMany({
        where: { schoolId, OR: [{ classTeacherId: t }, { subjects: { some: { teacherId: t } } }] },
        select: { id: true, name: true, classTeacherId: true, subjects: { where: { teacherId: t }, select: { subject: { select: { id: true, name: true } } } } },
        orderBy: { name: "asc" },
      });
      workspaces = rows
        .map((c) => ({ id: c.id, name: c.name, mode: (c.classTeacherId === t ? "CLASS" : "SUBJECT") as "CLASS" | "SUBJECT", subjects: c.subjects.map((s) => s.subject.name) }))
        .sort((a, b) => (a.mode === b.mode ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.mode === "CLASS" ? -1 : 1));
      const picked = (await cookies()).get(WORKSPACE_COOKIE)?.value;
      active = workspaces.find((w) => w.id === picked) ?? workspaces[0] ?? null;
      classIds = active ? [active.id] : [];
    } else if (user.role === "STUDENT") {
      const student = await db.student.findFirst({ where: { userId: user.id, schoolId, active: true, class: { schoolId } }, select: { id: true, classId: true } });
      childIds = student ? [student.id] : [];
      classIds = student ? [student.classId] : [];
    } else if (user.role === "PARENT") {
      const g = await db.guardian.findMany({ where: { userId: user.id }, include: { student: true } });
      childIds = g.map((x) => x.studentId);
      classIds = [...new Set(g.map((x) => x.student.classId))];
    }
  }
  const perms = (user.role === "TEACHER" ? user.teacher?.permissions ?? [] : []) as string[];
  return { support, access, user, schoolId: schoolId ?? "", role: user.role, classIds, childIds, teacherId: user.teacher?.id ?? null, workspaces, active, mode: (active?.mode ?? null) as "CLASS" | "SUBJECT" | null, perms, position: user.teacher?.position ?? null };
}

export const isStaff = (r: string) => r === "ADMIN" || r === "TEACHER";

export async function notify(schoolId: string, userIds: string[], title: string, body?: string, link?: string) {
  if (!userIds.length) return;
  await db.notification.createMany({ data: userIds.map((userId) => ({ schoolId, userId, title, body, link })) });
  try { await pushToUsers(userIds, { title, body, link }); } catch { /* push is best-effort */ }
}

/** Parent: pick the selected child (must belong to them). */
export async function pickChild(ctx: Awaited<ReturnType<typeof getCtx>>, childId?: string) {
  const kids = await db.student.findMany({ where: { id: { in: ctx.childIds }, schoolId: ctx.schoolId }, include: { class: true }, orderBy: { name: "asc" } });
  return { kids, kid: kids.find((k) => k.id === childId) ?? kids[0] };
}

export function userIdsOfClassParents(classId: string) {
  return db.guardian.findMany({ where: { student: { classId } }, select: { userId: true } }).then((r) => [...new Set(r.map((x) => x.userId))]);
}

/** True for the principal, or a teacher the principal has granted this permission. */
export const can = (ctx: Ctx, perm: Perm) => ctx.role === "ADMIN" || (ctx.role === "TEACHER" && ctx.perms.includes(perm));
/** Class teacher workspace (or principal) — daily class-management tools. */
export const isClassStaff = (ctx: Ctx) => ctx.role === "TEACHER" && ctx.mode === "CLASS";

/** Class ids this person may work with: whole school if the permission grants it, else their selected class. */
export async function scopeClassIds(ctx: Ctx, perm: Perm) {
  if (ctx.role === "TEACHER" && ctx.perms.includes(perm)) return (await db.class.findMany({ where: { schoolId: ctx.schoolId }, select: { id: true } })).map((c) => c.id);
  return ctx.classIds;
}
