"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { normalizePhone } from "@/lib/alerts";

const newCode = () => crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();

export async function startWhatsApp(fd: FormData) {
  const ctx = await getCtx();
  const phone = normalizePhone(String(fd.get("phone") ?? ""));
  if (!phone) redirect("/notifications?waerr=Enter+a+valid+mobile+number+with+country+code.");
  const taken = await db.whatsAppLink.findUnique({ where: { phone } });
  if (taken && taken.userId !== ctx.user.id) redirect("/notifications?waerr=That+number+is+already+linked+to+another+account.");
  await db.whatsAppLink.upsert({
    where: { userId: ctx.user.id },
    create: { userId: ctx.user.id, phone, code: newCode() },
    update: { phone, code: newCode(), verified: false, lastConvId: null },
  });
  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function toggleWhatsApp() {
  const ctx = await getCtx();
  const l = await db.whatsAppLink.findUnique({ where: { userId: ctx.user.id } });
  if (l) await db.whatsAppLink.update({ where: { id: l.id }, data: { optIn: !l.optIn } });
  revalidatePath("/notifications");
}

export async function disconnectWhatsApp() {
  const ctx = await getCtx();
  await db.whatsAppLink.deleteMany({ where: { userId: ctx.user.id } });
  revalidatePath("/notifications");
}
