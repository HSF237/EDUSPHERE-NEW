import { db } from "./db";

/** Digits only, with the country code added to 10-digit Indian-style numbers. */
export function normalizePhone(raw: string | null | undefined): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  d = d.replace(/^0+/, "");
  if (d.length === 10) d = (process.env.DEFAULT_COUNTRY_CODE || "91") + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const providerConfigured = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
const channelName = () => ((process.env.TWILIO_FROM ?? "").startsWith("whatsapp:") ? "WHATSAPP" : "SMS");

/**
 * Records a parent alert and, when a Twilio account is configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM),
 * sends it straight away. Otherwise it is kept as MANUAL so staff can send it with one tap from the Parent alerts page.
 */
export async function sendAlert(a: { schoolId: string; studentId?: string | null; phone: string; kind: string; body: string }) {
  const dup = a.studentId ? await db.alertLog.findFirst({ where: { schoolId: a.schoolId, studentId: a.studentId, kind: a.kind, body: a.body, phone: a.phone } }) : null;
  if (dup) return dup;
  if (!providerConfigured()) return db.alertLog.create({ data: { ...a, channel: "WHATSAPP", status: "MANUAL" } });
  const sid = process.env.TWILIO_ACCOUNT_SID!, from = process.env.TWILIO_FROM!;
  const wa = from.startsWith("whatsapp:");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  let status = "SENT", error: string | null = null;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: `${wa ? "whatsapp:" : ""}+${a.phone}`, From: from, Body: a.body }),
    });
    if (!r.ok) { status = "FAILED"; error = `Provider said ${r.status}`; }
  } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 120) : "Could not reach the provider"; }
  clearTimeout(timer);
  return db.alertLog.create({ data: { ...a, channel: channelName(), status, error } });
}
