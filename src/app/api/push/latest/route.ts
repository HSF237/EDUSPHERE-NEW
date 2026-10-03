import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ title: "EduSphere", body: "You have a new update.", link: "/dashboard" });
  const n = await db.notification.findFirst({ where: { userId: s.userId, read: false }, orderBy: { createdAt: "desc" } });
  return Response.json({ title: n?.title ?? "EduSphere", body: n?.body ?? "You have a new update.", link: "/notifications" });
}
