"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { can, getCtx, scopeClassIds, notify, userIdsOfClassParents } from "@/lib/scope";

const examSchema = z.object({ classId: z.string().min(1), name: z.string().trim().min(2).max(80), maxMarks: z.coerce.number().int().min(1).max(1000), passMarks: z.coerce.number().int().min(0), startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function createExam(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await getCtx();
  if (!can(ctx, "EXAMS")) return { error: "You do not have permission to create exams" };
  const p = examSchema.safeParse(Object.fromEntries(fd));
  if (!p.success || p.data.passMarks > p.data.maxMarks) return { error: "Check the exam details (pass marks cannot exceed max marks)." };
  const cls = await db.class.findFirst({ where: { id: p.data.classId, schoolId: ctx.schoolId } });
  if (!cls) return { error: "Class not found" };
  const exam = await db.exam.create({ data: { schoolId: ctx.schoolId, yearId: cls.yearId, classId: cls.id, name: p.data.name, maxMarks: p.data.maxMarks, passMarks: p.data.passMarks, startsOn: new Date(p.data.startsOn) } });
  const subs = await db.classSubject.findMany({ where: { classId: cls.id } });
  await db.examSchedule.createMany({ data: subs.map((s, i) => { const d = new Date(p.data.startsOn); d.setUTCDate(d.getUTCDate() + i); return { examId: exam.id, subjectId: s.subjectId, date: d, startTime: "09:00" }; }) });
  revalidatePath("/exams");
  return { ok: true };
}

const marksSchema = z.object({ examId: z.string(), subjectId: z.string(), entries: z.array(z.object({ studentId: z.string(), score: z.number().min(0) })) });

export async function saveMarks(input: z.infer<typeof marksSchema>) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") return { error: "Not allowed" };
  const p = marksSchema.safeParse(input);
  if (!p.success) return { error: "Invalid marks" };
  const exam = await db.exam.findFirst({ where: { id: p.data.examId, schoolId: ctx.schoolId, classId: { in: await scopeClassIds(ctx, "EXAMS") } } });
  if (!exam) return { error: "Exam not found" };
  if (exam.published && !can(ctx, "EXAMS")) return { error: "Results are published. Ask the principal to unpublish before editing." };
  if (ctx.role === "TEACHER") {
    const ok = await db.classSubject.findFirst({ where: { classId: exam.classId, subjectId: p.data.subjectId, teacherId: ctx.teacherId! } });
    if (!ok) return { error: "You do not teach this subject" };
  }
  if (p.data.entries.some((e) => e.score > exam.maxMarks)) return { error: `Marks cannot exceed ${exam.maxMarks}` };
  const valid = new Set((await db.student.findMany({ where: { classId: exam.classId }, select: { id: true } })).map((s) => s.id));
  const rows = p.data.entries.filter((e) => valid.has(e.studentId));
  await db.$transaction(rows.map((e) => db.mark.upsert({ where: { examId_subjectId_studentId: { examId: exam.id, subjectId: p.data.subjectId, studentId: e.studentId } }, create: { examId: exam.id, subjectId: p.data.subjectId, studentId: e.studentId, score: e.score }, update: { score: e.score } })));
  revalidatePath(`/exams/${exam.id}`);
  return { ok: true };
}

export async function setPublished(examId: string, publish: boolean) {
  const ctx = await getCtx();
  if (!can(ctx, "EXAMS")) return;
  const ex = await db.exam.findFirst({ where: { id: examId, schoolId: ctx.schoolId } });
  if (!ex) return;
  await db.exam.update({ where: { id: examId }, data: { published: publish } });
  if (publish) await notify(ctx.schoolId, await userIdsOfClassParents(ex.classId), "Results published", ex.name, "/exams");
  revalidatePath("/exams"); revalidatePath(`/exams/${examId}`);
}
