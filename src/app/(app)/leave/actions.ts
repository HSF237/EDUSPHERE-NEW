"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCtx, notify } from "@/lib/scope";

const schema = z.object({ studentId: z.string().min(1), fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().trim().min(5).max(500) });

export async function applyLeave(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await getCtx();
  if (ctx.role !== "PARENT") return { error: "Only parents can apply for leave" };
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please complete all fields (reason: 5+ characters)." };
  const d = p.data;
  if (!ctx.childIds.includes(d.studentId)) return { error: "Invalid student" };
  if (d.toDate < d.fromDate) return { error: "End date cannot be before start date" };
  const st = await db.student.findUniqueOrThrow({ where: { id: d.studentId }, include: { class: true } });
  await db.leaveRequest.create({ data: { schoolId: ctx.schoolId, studentId: d.studentId, requestedById: ctx.user.id, fromDate: new Date(d.fromDate), toDate: new Date(d.toDate), reason: d.reason } });
  const teachers = st.class.classTeacherId ? [(await db.teacher.findUnique({ where: { id: st.class.classTeacherId } }))!.userId] : [];
  const admins = (await db.user.findMany({ where: { schoolId: ctx.schoolId, role: "ADMIN" }, select: { id: true } })).map((a) => a.id);
  await notify(ctx.schoolId, [...teachers, ...admins], "Leave request", `${st.name} (${st.class.name}): ${d.fromDate} to ${d.toDate}`, "/leave");
  revalidatePath("/leave");
  return { ok: true };
}

export async function decideLeave(id: string, approve: boolean) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") return;
  const lr = await db.leaveRequest.findFirst({ where: { id, schoolId: ctx.schoolId, status: "PENDING", student: { classId: { in: ctx.classIds } } }, include: { student: true } });
  if (!lr) return;
  await db.leaveRequest.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED", decidedById: ctx.user.id } });
  await notify(ctx.schoolId, [lr.requestedById], `Leave ${approve ? "approved" : "declined"}`, lr.student.name, "/leave");
  revalidatePath("/leave");
}
