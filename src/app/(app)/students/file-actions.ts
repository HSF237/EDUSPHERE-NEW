"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds } from "@/lib/scope";
import { isError, readUpload, storeFile } from "@/lib/files";

type State = { error?: string; ok?: string } | undefined;

async function allowed(studentId: string) {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN" && ctx.role !== "TEACHER") return null;
  const st = await db.student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId, classId: { in: await scopeClassIds(ctx, "STUDENTS") } } });
  return st ? { ctx, st } : null;
}

export async function uploadStudentPhoto(studentId: string, _: State, fd: FormData): Promise<State> {
  const a = await allowed(studentId);
  if (!a) return { error: "You can’t change this student." };
  const up = await readUpload(fd, "file", true);
  if (!up) return { error: "Choose a photo first." };
  if (isError(up)) return { error: up.error };
  const id = await storeFile(a.ctx.schoolId, a.ctx.user.id, up, a.st.id);
  const old = a.st.photoFileId;
  await db.student.update({ where: { id: a.st.id }, data: { photoFileId: id } });
  if (old) await db.file.deleteMany({ where: { id: old, schoolId: a.ctx.schoolId } });
  revalidatePath(`/students/${a.st.id}`);
  return { ok: "Photo updated." };
}

export async function addStudentDoc(studentId: string, _: State, fd: FormData): Promise<State> {
  const a = await allowed(studentId);
  if (!a) return { error: "You can’t change this student." };
  const up = await readUpload(fd);
  if (!up) return { error: "Choose a file first." };
  if (isError(up)) return { error: up.error };
  await storeFile(a.ctx.schoolId, a.ctx.user.id, up, a.st.id);
  await db.auditLog.create({ data: { schoolId: a.ctx.schoolId, userId: a.ctx.user.id, action: "student_doc_add", entity: a.st.id } });
  revalidatePath(`/students/${a.st.id}`);
  return { ok: "Document added." };
}

export async function deleteStudentDoc(studentId: string, fileId: string) {
  const a = await allowed(studentId);
  if (!a) return;
  await db.file.deleteMany({ where: { id: fileId, studentId: a.st.id, schoolId: a.ctx.schoolId, NOT: { id: a.st.photoFileId ?? "" } } });
  revalidatePath(`/students/${a.st.id}`);
}
