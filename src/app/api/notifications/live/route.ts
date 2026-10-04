import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { kindOf, parsePrefs, wantsAlert } from "@/lib/notif";

export const dynamic = "force-dynamic";

/** Polled by the bell: the unread count plus anything new since `since`, each flagged for pop-up or not per the person's settings. */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return new Response("Sign in first", { status: 401 });
  const raw = new URL(req.url).searchParams.get("since");
  const since = raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw) : new Date();
  const now = new Date();
  const [unread, items, u] = await Promise.all([
    db.notification.count({ where: { userId: s.userId, read: false } }),
    db.notification.findMany({ where: { userId: s.userId, createdAt: { gt: since } }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.user.findUnique({ where: { id: s.userId }, select: { notifPrefs: true } }),
  ]);
  const prefs = parsePrefs(u?.notifPrefs);
  const quiet = !wantsAlert(prefs, "other", now);
  const last = items.length ? items[items.length - 1].createdAt : now;
  return Response.json({
    unread,
    now: (items.length === 5 ? last : now).toISOString(),
    sound: prefs.sound,
    items: items.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, toast: !quiet && wantsAlert(prefs, kindOf(n.link), now) })),
  }, { headers: { "Cache-Control": "no-store" } });
}
