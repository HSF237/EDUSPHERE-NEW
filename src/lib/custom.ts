import { db } from "./db";

/** The paid "Custom school" add-on: own logo, colours, signature, login page and web address. */
export const hasCustom = (s: { customUntil: Date | null } | null | undefined, now = new Date()) => !!s?.customUntil && s.customUntil > now;

export const cleanHost = (h: string | null | undefined) => (h ?? "").split(",")[0].toLowerCase().split(":")[0].trim();
export const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/** The school whose own web address this request came in on (only while their add-on is active). */
export async function schoolByHost(host: string | null | undefined) {
  const h = cleanHost(host);
  if (!h) return null;
  const s = await db.school.findUnique({ where: { customDomain: h } });
  return s && s.active && hasCustom(s) ? s : null;
}
