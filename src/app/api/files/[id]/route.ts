import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isInline } from "@/lib/files";

export const dynamic = "force-dynamic";

/** Serves an uploaded file to signed-in members of the same school. Files tied to a student are limited to staff and that student's guardians. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) return new Response("Sign in first", { status: 401 });
  const u = await db.user.findUnique({ where: { id: s.userId } });
  if (!u || !u.active || !u.schoolId) return new Response("Not allowed", { status: 403 });
  const f = await db.file.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!f) return new Response("Not found", { status: 404 });
  if (f.studentId && u.role === "PARENT") {
    const g = await db.guardian.findUnique({ where: { userId_studentId: { userId: u.id, studentId: f.studentId } } });
    if (!g) return new Response("Not found", { status: 404 });
  }
  const inline = isInline(f.mime);
  return new Response(Buffer.from(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
