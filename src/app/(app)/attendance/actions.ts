"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { can, getCtx, notify } from "@/lib/scope";

const statuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
const schema = z.object({
  classId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(z.object({ studentId: z.string(), status: z.enum(statuses) })).min(1),
});

export async function saveAttendance(input: z.infer<typeof schema>) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER" && ctx.role !== "ADMIN") return { error: "Not allowed" };
  if (ctx.role === "TEACHER" && ctx.mode !== "CLASS") return { error: "Attendance is marked by the class teacher. Switch to your own class." };
  const p = schema.safeParse(input);
  if (!p.success) return { error: "Invalid data" };
  const { classId, date, entries } = p.data;
  if (!ctx.classIds.includes(classId)) return { error: "You are not assigned to this class" };
  const d = new Date(date);
  if (d > new Date()) return { error: "Cannot mark attendance for a future date" };
  const ids = new Set((await db.student.findMany({ where: { classId, schoolId: ctx.schoolId, active: true }, select: { id: true } })).map((s) => s.id));
  const clean = entries.filter((e) => ids.has(e.studentId));
  const existing = await db.attendanceSession.findUnique({ where: { classId_date: { classId, date: d } } });
  if (existing?.status === "APPROVED" && ctx.role !== "ADMIN") return { error: "This register is approved and locked. Ask the principal to reopen it." };
  await db.$transaction(async (tx) => {
    const ses = await tx.attendanceSession.upsert({
      where: { classId_date: { classId, date: d } },
      create: { schoolId: ctx.schoolId, classId, date: d, markedById: ctx.user.id, status: ctx.role === "ADMIN" ? "APPROVED" : "PENDING" },
      update: { markedById: ctx.user.id, status: ctx.role === "ADMIN" ? "APPROVED" : "PENDING", reviewNote: null },
    });
    await tx.attendanceRecord.deleteMany({ where: { sessionId: ses.id } });
    await tx.attendanceRecord.createMany({ data: clean.map((e) => ({ sessionId: ses.id, studentId: e.studentId, status: e.status })) });
  });
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reviewAttendance(sessionId: string, approve: boolean, note?: string) {
  const ctx = await getCtx();
  if (!can(ctx, "ATTENDANCE_APPROVE")) return;
  const ses = await db.attendanceSession.findFirst({ where: { id: sessionId, schoolId: ctx.schoolId }, include: { class: true, records: { include: { student: { include: { guardians: true } } } } } });
  if (!ses) return;
  await db.attendanceSession.update({ where: { id: ses.id }, data: { status: approve ? "APPROVED" : "REJECTED", reviewedById: ctx.user.id, reviewNote: note || null } });
  if (approve) {
    const parents = ses.records.filter((r) => r.status === "ABSENT").flatMap((r) => r.student.guardians.map((g) => g.userId));
    await notify(ctx.schoolId, [...new Set(parents)], "Absence recorded", `Your child was marked absent in class ${ses.class.name}.`, "/attendance");
  } else {
    await notify(ctx.schoolId, [ses.markedById], "Attendance returned", `Class ${ses.class.name} register needs correction. ${note ?? ""}`, "/attendance");
  }
  revalidatePath("/attendance");
}
