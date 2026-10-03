"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCtx, notify, userIdsOfClassParents } from "@/lib/scope";

const schema = z.object({
  classId: z.string().min(1), subjectId: z.string().min(1),
  title: z.string().trim().min(3).max(120), description: z.string().trim().min(3).max(2000),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function createHomework(_: { error?: string } | undefined, fd: FormData) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER") return { error: "Homework is assigned by teachers." };
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fill every field (title 3+ characters)." };
  const d = p.data;
  if (!ctx.classIds.includes(d.classId)) return { error: "You cannot assign homework to this class" };
  const cs = await db.classSubject.findFirst({ where: { classId: d.classId, subjectId: d.subjectId, ...(ctx.role === "TEACHER" ? { teacherId: ctx.teacherId! } : {}) } });
  if (!cs) return { error: "You do not teach this subject in this class" };
  const hw = await db.homework.create({ data: { schoolId: ctx.schoolId, classId: d.classId, subjectId: d.subjectId, teacherId: cs.teacherId, title: d.title, description: d.description, dueOn: new Date(d.dueOn) } });
  const students = await db.student.findMany({ where: { classId: d.classId, active: true }, select: { id: true } });
  await db.homeworkSubmission.createMany({ data: students.map((s) => ({ homeworkId: hw.id, studentId: s.id })) });
  await notify(ctx.schoolId, await userIdsOfClassParents(d.classId), "New homework", d.title, "/homework");
  revalidatePath("/homework");
  redirect(`/homework/${hw.id}`);
}

export async function toggleSubmission(homeworkId: string, studentId: string, done: boolean) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER") return;
  const hw = await db.homework.findFirst({ where: { id: homeworkId, schoolId: ctx.schoolId, classId: { in: ctx.classIds } } });
  if (!hw) return;
  await db.homeworkSubmission.upsert({ where: { homeworkId_studentId: { homeworkId, studentId } }, create: { homeworkId, studentId, done }, update: { done } });
  revalidatePath(`/homework/${homeworkId}`);
}

export async function closeHomework(id: string) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER") return;
  await db.homework.updateMany({ where: { id, schoolId: ctx.schoolId, classId: { in: ctx.classIds } }, data: { status: "CLOSED" } });
  revalidatePath("/homework");
}
