import crypto from "node:crypto";
import { db } from "./db";
import { normalizePhone } from "./alerts";

/** WhatsApp Business Cloud API (Meta). Without keys everything is skipped and the UI says "not connected". */
export const waConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
export const waNumber = () => process.env.WHATSAPP_DISPLAY_NUMBER ?? "";
const base = () => process.env.WHATSAPP_API_BASE || "https://graph.facebook.com/v21.0";
const WINDOW = 24 * 3600 * 1000;

export { normalizePhone };

export function verifyWebhookSignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expect = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expect), b = Buffer.from(header.slice(7));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function post(payload: object): Promise<string | null> {
  const r = await fetch(`${base()}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { messages?: { id: string }[] };
  return j.messages?.[0]?.id ?? null;
}

type Link = { id: string; phone: string; lastInboundAt: Date | null };

/** Plain text: only allowed by WhatsApp within 24h of the user's last message to us. */
export async function sendText(link: Link, text: string, convId?: string) {
  const id = await post({ to: link.phone, type: "text", text: { body: text.slice(0, 1500), preview_url: false } });
  if (id) {
    await db.whatsAppMsg.create({ data: { id, linkId: link.id, dir: "OUT", convId: convId ?? null } }).catch(() => {});
    if (convId) await db.whatsAppLink.update({ where: { id: link.id }, data: { lastConvId: convId } }).catch(() => {});
  }
  return id;
}

/** One-off reply to anyone who just messaged us (inside their 24h window). */
export async function replyTo(phone: string, text: string) {
  return post({ to: phone, type: "text", text: { body: text.slice(0, 1500), preview_url: false } }).catch(() => null);
}

/** Sends a notification: free text inside the 24h window, otherwise the approved template (WHATSAPP_TEMPLATE, 2 variables). */
export async function deliver(link: Link, title: string, body: string | null | undefined, convId?: string) {
  const inWindow = !!link.lastInboundAt && Date.now() - link.lastInboundAt.getTime() < WINDOW;
  const line = body ? `${title}\n${body}` : title;
  if (inWindow) return sendText(link, convId ? `${line}\n\n_Reply to this message to answer._` : line, convId);
  const tpl = process.env.WHATSAPP_TEMPLATE;
  if (!tpl) return null;
  const clean = (s: string) => s.replace(/[\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 300) || "-";
  const id = await post({ to: link.phone, type: "template", template: { name: tpl, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" }, components: [{ type: "body", parameters: [{ type: "text", text: clean(title) }, { type: "text", text: clean(body ?? "Open EduSphere to see details.") }] }] } });
  if (id) {
    await db.whatsAppMsg.create({ data: { id, linkId: link.id, dir: "OUT", convId: convId ?? null } }).catch(() => {});
    if (convId) await db.whatsAppLink.update({ where: { id: link.id }, data: { lastConvId: convId } }).catch(() => {});
  }
  return id;
}

/** Best-effort fan-out used by notify(). Never throws. */
export async function whatsappToUsers(userIds: string[], title: string, body?: string, link?: string) {
  if (!waConfigured() || !userIds.length) return;
  const convId = link?.startsWith("/messages?c=") ? link.slice("/messages?c=".length) : undefined;
  const links = await db.whatsAppLink.findMany({ where: { userId: { in: userIds }, verified: true, optIn: true }, select: { id: true, phone: true, lastInboundAt: true } });
  await Promise.allSettled(links.map((l) => deliver(l, title, body, convId)));
}
