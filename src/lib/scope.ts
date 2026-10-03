import { db } from "./db";
import { requireUser } from "./session";

export type Ctx = Awaited<ReturnType<typeof getCtx>>;

/** Resolves the signed-in user plus what they are allowed to see. Every page/action starts here. */
export async function getCtx() {
  const user = await requireUser();
  const schoolId = user.schoolId;
  let classIds: string[] = [];
  let childIds: string[] = [];
  if (schoolId) {
    if (user.role === "ADMIN") {
      classIds = (await db.class.findMany({ where: { schoolId }, select: { id: true } })).map((c) => c.id);
    } else if (user.role === "TEACHER" && user.teacher) {
      const t = user.teacher.id;
      const rows = await db.class.findMany({
        where: { schoolId, OR: [{ classTeacherId: t }, { subjects: { some: { teacherId: t } } }] },
        select: { id: true },
      });
      classIds = rows.map((c) => c.id);
    } else if (user.role === "PARENT") {
      const g = await db.guardian.findMany({ where: { userId: user.id }, include: { student: true } });
      childIds = g.map((x) => x.studentId);
      classIds = [...new Set(g.map((x) => x.student.classId))];
    }
  }
  return { user, schoolId: schoolId ?? "", role: user.role, classIds, childIds, teacherId: user.teacher?.id ?? null };
}

export const isStaff = (r: string) => r === "ADMIN" || r === "TEACHER";

export async function notify(schoolId: string, userIds: string[], title: string, body?: string, link?: string) {
  if (!userIds.length) return;
  await db.notification.createMany({ data: userIds.map((userId) => ({ schoolId, userId, title, body, link })) });
}

/** Parent: pick the selected child (must belong to them). */
export async function pickChild(ctx: Awaited<ReturnType<typeof getCtx>>, childId?: string) {
  const kids = await db.student.findMany({ where: { id: { in: ctx.childIds }, schoolId: ctx.schoolId }, include: { class: true }, orderBy: { name: "asc" } });
  return { kids, kid: kids.find((k) => k.id === childId) ?? kids[0] };
}

export function userIdsOfClassParents(classId: string) {
  return db.guardian.findMany({ where: { student: { classId } }, select: { userId: true } }).then((r) => [...new Set(r.map((x) => x.userId))]);
}
