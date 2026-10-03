"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";

export async function markAlertSent(id: string) {
  const ctx = await getCtx();
  if (!can(ctx, "ATTENDANCE_APPROVE") && ctx.role !== "ADMIN") return;
  await db.alertLog.updateMany({ where: { id, schoolId: ctx.schoolId, status: "MANUAL" }, data: { status: "SENT", channel: "WHATSAPP" } });
  revalidatePath("/alerts");
}
