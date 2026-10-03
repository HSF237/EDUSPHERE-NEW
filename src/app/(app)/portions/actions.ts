"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCtx, notify, userIdsOfClassParents } from "@/lib/scope";

const schema = z.object({
  classId: z.string().min(1), subjectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topic: z.string().trim().min(3, "Topic is too short").max(200),
  notes: z.string().trim().max(2000).optional(),
});

export async function addPortion(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER" || !ctx.teacherId) return { error: "Only teachers can post discussed portions" };
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Please complete all fields." };
  const d = p.data;
  if (!ctx.classIds.includes(d.classId)) return { error: "Select your class from the switcher at the top first." };
  if (new Date(d.date) > new Date(Date.now() + 864e5)) return { error: "Date cannot be in the future" };
  const cs = await db.classSubject.findFirst({ where: { classId: d.classId, subjectId: d.subjectId, teacherId: ctx.teacherId }, include: { subject: true, class: true } });
  if (!cs) return { error: "You do not teach this subject in this class" };
  await db.portion.create({ data: { schoolId: ctx.schoolId, classId: d.classId, subjectId: d.subjectId, teacherId: ctx.teacherId, date: new Date(d.date), topic: d.topic, notes: d.notes || null } });
  await notify(ctx.schoolId, await userIdsOfClassParents(d.classId), `${cs.subject.name}: portion covered`, d.topic, "/portions");
  revalidatePath("/portions"); revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePortion(id: string) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT" || ctx.role === "SUPER_ADMIN") return;
  const row = await db.portion.findFirst({ where: { id, schoolId: ctx.schoolId } });
  if (!row) return;
  if (ctx.role === "TEACHER" && row.teacherId !== ctx.teacherId) return;
  await db.portion.delete({ where: { id } });
  revalidatePath("/portions");
}
