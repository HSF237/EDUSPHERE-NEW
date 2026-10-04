import { db } from "@/lib/db";
import { hasCustom } from "@/lib/custom";

export const dynamic = "force-dynamic";

/** A school's logo for the public sign-in page. Only while the Custom school add-on is active, and only image types. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.school.findUnique({ where: { id }, select: { active: true, customUntil: true, logoFileId: true } });
  if (!s || !s.active || !hasCustom(s) || !s.logoFileId) return new Response("Not found", { status: 404 });
  const f = await db.file.findFirst({ where: { id: s.logoFileId, schoolId: id } });
  if (!f || !/^image\/(png|jpeg|webp)$/.test(f.mime)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.data), { headers: { "Content-Type": f.mime, "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": "public, max-age=300" } });
}
