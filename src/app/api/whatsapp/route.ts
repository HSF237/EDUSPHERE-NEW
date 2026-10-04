import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notify } from "@/lib/scope";
import { accessOf, isReadOnly } from "@/lib/billing";
import { replyTo, verifyWebhookSignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** Meta calls this once when you save the webhook URL. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ok = u.searchParams.get("hub.mode") === "subscribe" && !!process.env.WHATSAPP_VERIFY_TOKEN && u.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN;
  return ok ? new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 }) : new Response("Forbidden", { status: 403 });
}

type InMsg = { id: string; from: string; type: string; text?: { body?: string }; context?: { id?: string } };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Forbidden", { status: 403 });
  let payload: { entry?: { changes?: { value?: { messages?: InMsg[] } }[] }[] };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }
  const msgs = (payload.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  for (const m of msgs) {
    try { await handle(m); } catch (e) { console.error("whatsapp inbound failed", e instanceof Error ? e.message : e); }
  }
  return NextResponse.json({ ok: true });
}

async function handle(m: InMsg) {
  const phone = String(m.from ?? "").replace(/\D/g, "");
  if (!phone || !m.id) return;
  const text = (m.text?.body ?? "").trim();
  let link = await db.whatsAppLink.findUnique({ where: { phone }, include: { user: { include: { school: true } } } });

  // Verification: the user texts "LINK ABC123" from the number they entered in the app.
  const lm = /^link\s+([a-z0-9]{6})$/i.exec(text);
  if (lm) {
    if (!link || link.verified || !link.code || link.code !== lm[1].toUpperCase()) { await replyTo(phone, "That code didn't match. Open EduSphere, go to Notifications, and copy the link code again."); return; }
    await db.whatsAppLink.update({ where: { id: link.id }, data: { verified: true, code: null, lastInboundAt: new Date() } });
    await replyTo(phone, `Connected, ${link.user.name}. EduSphere notifications will now arrive here, and you can reply to a message from a person to answer them. Send STOP to pause.`);
    return;
  }
  if (!link || !link.verified) { await replyTo(phone, "This number isn't linked to an EduSphere account yet. Open EduSphere, go to Notifications, and choose Connect WhatsApp."); return; }

  // Meta retries deliveries, so each inbound id is handled once.
  try { await db.whatsAppMsg.create({ data: { id: m.id, linkId: link.id, dir: "IN" } }); } catch { return; }
  await db.whatsAppLink.update({ where: { id: link.id }, data: { lastInboundAt: new Date() } });
  const word = text.toUpperCase();
  if (word === "STOP") { await db.whatsAppLink.update({ where: { id: link.id }, data: { optIn: false } }); await replyTo(phone, "Paused. You won't get EduSphere messages here. Send START to turn them back on."); return; }
  if (word === "START") { await db.whatsAppLink.update({ where: { id: link.id }, data: { optIn: true } }); await replyTo(phone, "Back on. EduSphere messages will arrive here again."); return; }
  if (m.type !== "text" || !text) { await replyTo(phone, "Only text messages can be sent into EduSphere chats for now."); return; }

  const user = link.user;
  if (!user.active || !user.schoolId || !user.school || isReadOnly(accessOf(user.school).state)) { await replyTo(phone, "Your school account is read-only right now, so this message wasn't sent. Please ask your principal."); return; }

  // Which chat? The message you swiped to reply to, else the chat that last messaged you.
  let convId: string | null = null;
  if (m.context?.id) convId = (await db.whatsAppMsg.findFirst({ where: { id: m.context.id, linkId: link.id }, select: { convId: true } }))?.convId ?? null;
  if (!convId) convId = link.lastConvId;
  if (!convId) { await replyTo(phone, "Which chat is this for? Swipe to reply to a message from the person you want to answer, or open EduSphere to start a new chat."); return; }
  const conv = await db.conversation.findFirst({ where: { id: convId, schoolId: user.schoolId, members: { some: { userId: user.id } } }, include: { members: true } });
  if (!conv) { await replyTo(phone, "That chat is no longer available."); return; }

  const body = text.slice(0, 4000);
  const now = new Date();
  await db.$transaction([
    db.message.create({ data: { conversationId: conv.id, senderId: user.id, body } }),
    db.conversation.update({ where: { id: conv.id }, data: { updatedAt: now } }),
    db.conversationMember.updateMany({ where: { conversationId: conv.id, userId: user.id }, data: { lastReadAt: now, lastDeliveredAt: now } }),
  ]);
  await db.whatsAppMsg.update({ where: { id: m.id }, data: { convId: conv.id } });
  const to = conv.members.filter((x) => x.userId !== user.id).map((x) => x.userId);
  await notify(user.schoolId, to, `Message from ${user.name}`, body.slice(0, 80), `/messages?c=${conv.id}`, body);
}
