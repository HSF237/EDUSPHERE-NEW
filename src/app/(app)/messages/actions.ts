"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCtx, notify } from "@/lib/scope";

export async function allowedRecipients(ctx: Awaited<ReturnType<typeof getCtx>>) {
  const base = { schoolId: ctx.schoolId, active: true, id: { not: ctx.user.id } };
  if (ctx.role === "ADMIN") return db.user.findMany({ where: base, select: { id: true, name: true, role: true }, orderBy: { name: "asc" }, take: 500 });
  if (ctx.role === "TEACHER")
    return db.user.findMany({ where: { ...base, OR: [{ role: "ADMIN" }, { role: "PARENT", children: { some: { student: { classId: { in: ctx.classIds } } } } }] }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" }, take: 500 });
  return db.user.findMany({ where: { ...base, OR: [{ role: "ADMIN" }, { role: "TEACHER", teacher: { OR: [{ homeroom: { some: { id: { in: ctx.classIds } } } }, { assignments: { some: { classId: { in: ctx.classIds } } } }] } }] }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } });
}

const startSchema = z.object({ to: z.string().min(1), subject: z.string().trim().min(2).max(120), body: z.string().trim().min(1).max(4000) });

export async function startConversation(_: { error?: string } | undefined, fd: FormData) {
  const ctx = await getCtx();
  const p = startSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Choose a recipient and write a subject and message." };
  const ok = (await allowedRecipients(ctx)).some((u) => u.id === p.data.to);
  if (!ok) return { error: "You cannot message this person." };
  const c = await db.conversation.create({
    data: { schoolId: ctx.schoolId, subject: p.data.subject, members: { create: [{ userId: ctx.user.id }, { userId: p.data.to }] }, messages: { create: { senderId: ctx.user.id, body: p.data.body } } },
  });
  await notify(ctx.schoolId, [p.data.to], `Message from ${ctx.user.name}`, p.data.subject, `/messages?c=${c.id}`);
  revalidatePath("/messages");
  redirect(`/messages?c=${c.id}`);
}

export async function sendMessage(conversationId: string, fd: FormData) {
  const ctx = await getCtx();
  const body = String(fd.get("body") ?? "").trim().slice(0, 4000);
  if (!body) return;
  const c = await db.conversation.findFirst({ where: { id: conversationId, schoolId: ctx.schoolId, members: { some: { userId: ctx.user.id } } }, include: { members: true } });
  if (!c) return;
  await db.$transaction([
    db.message.create({ data: { conversationId, senderId: ctx.user.id, body } }),
    db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    db.conversationMember.updateMany({ where: { conversationId, userId: ctx.user.id }, data: { lastReadAt: new Date() } }),
  ]);
  await notify(ctx.schoolId, c.members.filter((m) => m.userId !== ctx.user.id).map((m) => m.userId), `Message from ${ctx.user.name}`, c.subject, `/messages?c=${c.id}`);
  revalidatePath("/messages");
}
