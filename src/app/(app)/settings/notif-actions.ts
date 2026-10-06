"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { KINDS, parsePrefs } from "@/lib/notif";

export async function saveNotifPrefs(fd: FormData) {
  const ctx = await getCtx({ allowLocked: true, allowStudent: true });
  const on = new Set(fd.getAll("kind").map(String));
  const quietOn = fd.get("quietOn") === "on";
  const prefs = parsePrefs({
    off: KINDS.map((k) => k.id).filter((id) => !on.has(id)),
    quiet: quietOn ? { from: String(fd.get("from") ?? ""), to: String(fd.get("to") ?? "") } : null,
    sound: fd.get("sound") === "on",
  });
  await db.user.update({ where: { id: ctx.user.id }, data: { notifPrefs: prefs } });
  revalidatePath("/settings");
}
