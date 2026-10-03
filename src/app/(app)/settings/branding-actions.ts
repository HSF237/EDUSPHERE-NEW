"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { isError, readUpload, storeFile } from "@/lib/files";
import { validColour } from "@/lib/branding";

type State = { error?: string; ok?: string } | undefined;

export async function saveBranding(_: State, fd: FormData): Promise<State> {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return { error: "Only the principal can change school branding." };
  const colour = String(fd.get("brandColor") ?? "").trim();
  if (colour && !validColour(colour)) return { error: "Choose a valid colour." };
  const signatoryName = String(fd.get("signatoryName") ?? "").trim().slice(0, 80) || null;
  const signatoryTitle = String(fd.get("signatoryTitle") ?? "").trim().slice(0, 80) || null;
  const school = await db.school.findUnique({ where: { id: ctx.schoolId } });
  if (!school) return { error: "School not found." };
  const data: Record<string, string | null> = { brandColor: colour || null, signatoryName, signatoryTitle };
  const old: string[] = [];
  for (const [field, col, rm] of [["logo", "logoFileId", "removeLogo"], ["signature", "signatureFileId", "removeSignature"]] as const) {
    const up = await readUpload(fd, field, true);
    if (isError(up)) return { error: up.error };
    if (up) { old.push((school as Record<string, unknown>)[col] as string); data[col] = await storeFile(ctx.schoolId, ctx.user.id, up); }
    else if (fd.get(rm) === "on") { old.push((school as Record<string, unknown>)[col] as string); data[col] = null; }
  }
  await db.school.update({ where: { id: ctx.schoolId }, data });
  const gone = old.filter(Boolean);
  if (gone.length) await db.file.deleteMany({ where: { id: { in: gone }, schoolId: ctx.schoolId } });
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "branding_update" } });
  revalidatePath("/", "layout");
  return { ok: "Branding saved." };
}
