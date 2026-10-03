"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx, notify } from "@/lib/scope";

export async function allowedRecipients(ctx: Awaited<ReturnType<typeof getCtx>>) {
  const base = { schoolId: ctx.schoolId, active: true, id: { not: ctx.user.id } };
  if (ctx.role === "ADMIN") return db.user.findMany({ where: base, select: { id: true, name: true, role: true }, orderBy: { name: "asc" }, take: 500 });
  if (ctx.role === "TEACHER")
    return db.user.findMany({ where: { ...base, OR: [{ role: "ADMIN" }, { role: "PARENT", children: { some: { student: { classId: { in: ctx.workspaces.map((w) => w.id) } } } } }] }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" }, take: 500 });
  return db.user.findMany({ where: { ...base, OR: [{ role: "ADMIN" }, { role: "TEACHER", teacher: { OR: [{ homeroom: { some: { id: { in: ctx.classIds } } } }, { assignments: { some: { classId: { in: ctx.classIds } } } }] } }] }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } });
}

/** WhatsApp-style send: continues an existing chat, or opens one with `userId` on the first message. */
export async function sendChat(input: { conversationId?: string; userId?: string; body: string }): Promise<{ id?: string; error?: string }> {
  const ctx = await getCtx();
  const body = String(input.body ?? "").trim().slice(0, 4000);
  if (!body) return { error: "Write a message first." };
  let convId = input.conversationId;
  let recipients: string[] = [];
  if (convId) {
    const c = await db.conversation.findFirst({ where: { id: convId, schoolId: ctx.schoolId, members: { some: { userId: ctx.user.id } } }, include: { members: true } });
    if (!c) return { error: "Conversation not found." };
    recipients = c.members.filter((m) => m.userId !== ctx.user.id).map((m) => m.userId);
  } else {
    const to = String(input.userId ?? "");
    if (!(await allowedRecipients(ctx)).some((u) => u.id === to)) return { error: "You cannot message this person." };
    const existing = await db.conversation.findFirst({ where: { schoolId: ctx.schoolId, AND: [{ members: { some: { userId: ctx.user.id } } }, { members: { some: { userId: to } } }] }, select: { id: true } });
    convId = existing?.id ?? (await db.conversation.create({ data: { schoolId: ctx.schoolId, subject: "Chat", members: { create: [{ userId: ctx.user.id }, { userId: to }] } } })).id;
    recipients = [to];
  }
  await db.$transaction([
    db.message.create({ data: { conversationId: convId, senderId: ctx.user.id, body } }),
    db.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } }),
    db.conversationMember.updateMany({ where: { conversationId: convId, userId: ctx.user.id }, data: { lastReadAt: new Date() } }),
  ]);
  await notify(ctx.schoolId, recipients, `Message from ${ctx.user.name}`, body.slice(0, 80), `/messages?c=${convId}`);
  revalidatePath("/messages");
  return { id: convId };
}
