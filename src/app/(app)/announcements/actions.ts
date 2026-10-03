"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { can, getCtx, notify } from "@/lib/scope";
import { isError, readUpload, storeFile } from "@/lib/files";

const schema = z.object({ title: z.string().trim().min(3).max(120), body: z.string().trim().min(3).max(4000), audience: z.enum(["ALL", "TEACHERS", "PARENTS"]), pinned: z.string().optional() });

export async function postAnnouncement(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await getCtx();
  if (!can(ctx, "ANNOUNCE")) return { error: "You do not have permission to post announcements" };
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Title and message are required." };
  const d = p.data;
  const up = await readUpload(fd);
  if (isError(up)) return { error: up.error };
  const fileId = up ? await storeFile(ctx.schoolId, ctx.user.id, up) : null;
  await db.announcement.create({ data: { schoolId: ctx.schoolId, authorId: ctx.user.id, title: d.title, body: d.body, audience: d.audience, pinned: !!d.pinned, fileId } });
  const roles = d.audience === "ALL" ? ["TEACHER", "PARENT"] : d.audience === "TEACHERS" ? ["TEACHER"] : ["PARENT"];
  const users = await db.user.findMany({ where: { schoolId: ctx.schoolId, role: { in: roles as ("TEACHER" | "PARENT")[] }, active: true }, select: { id: true } });
  await notify(ctx.schoolId, users.map((u) => u.id), d.title, d.body.slice(0, 120), "/announcements");
  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  const ctx = await getCtx();
  if (!can(ctx, "ANNOUNCE")) return;
  await db.announcement.deleteMany({ where: { id, schoolId: ctx.schoolId } });
  revalidatePath("/announcements");
}
