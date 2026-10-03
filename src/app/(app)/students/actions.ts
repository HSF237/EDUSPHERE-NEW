"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";

const schema = z.object({ name: z.string().trim().min(2).max(100), classId: z.string().min(1), gender: z.enum(["F", "M"]), dob: z.string().optional(), parentEmail: z.string().email().optional().or(z.literal("")), parentName: z.string().trim().max(100).optional() });

export async function createStudent(fd: FormData) {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return;
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const d = p.data;
  const cls = await db.class.findFirst({ where: { id: d.classId, schoolId: ctx.schoolId } });
  if (!cls) return;
  const roll = ((await db.student.aggregate({ where: { classId: cls.id }, _max: { rollNo: true } }))._max.rollNo ?? 0) + 1;
  const st = await db.student.create({ data: { schoolId: ctx.schoolId, classId: cls.id, admissionNo: `${cls.name}-${String(roll).padStart(3, "0")}-${Date.now().toString(36).slice(-3).toUpperCase()}`, rollNo: roll, name: d.name, gender: d.gender, dob: d.dob ? new Date(d.dob) : null } });
  if (d.parentEmail) {
    const email = d.parentEmail.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing || existing.schoolId === ctx.schoolId) {
      const u = existing ?? (await db.user.create({ data: { schoolId: ctx.schoolId, email, name: d.parentName || "Parent", role: "PARENT", passwordHash: await bcrypt.hash("ChangeMe123!", 12) } }));
      if (u.role === "PARENT") await db.guardian.create({ data: { userId: u.id, studentId: st.id } });
    }
  }
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "student_create", entity: st.id } });
  revalidatePath("/students");
}
