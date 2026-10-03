"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCtx, WORKSPACE_COOKIE } from "@/lib/scope";

export async function setWorkspace(classId: string) {
  const ctx = await getCtx();
  if (ctx.role !== "TEACHER" || !ctx.workspaces.some((w) => w.id === classId)) return;
  (await cookies()).set(WORKSPACE_COOKIE, classId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  revalidatePath("/", "layout");
}
