import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return new Response("Sign in first", { status: 401 });
  const b = await req.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!b?.endpoint || !b.keys?.p256dh || !b.keys?.auth || !/^https:\/\//.test(b.endpoint) || b.endpoint.length > 1000) return new Response("Bad subscription", { status: 400 });
  await db.pushSub.upsert({ where: { endpoint: b.endpoint }, create: { userId: s.userId, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth }, update: { userId: s.userId, p256dh: b.keys.p256dh, auth: b.keys.auth } });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return new Response("Sign in first", { status: 401 });
  const b = await req.json().catch(() => null) as { endpoint?: string } | null;
  if (b?.endpoint) await db.pushSub.deleteMany({ where: { endpoint: b.endpoint, userId: s.userId } });
  return Response.json({ ok: true });
}
