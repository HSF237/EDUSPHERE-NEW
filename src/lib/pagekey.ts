/**
 * Per-user, per-section page keys used in URLs, e.g. /classes/09807726217hhdhhiaCHL.
 * Derived with HMAC from the user id, so no database is needed (works in the edge middleware)
 * and a key from one person or section never works for another. Shape: 11 digits + 8 lowercase + 3 uppercase.
 */
export const PAGE_KEY_RE = /^\d{11}[a-z]{8}[A-Z]{3}$/;
const enc = new TextEncoder();

export async function pageKey(userId: string, section: string, secret: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(`pagekey:${section}:${userId}`)));
  let out = "";
  for (let i = 0; i < 11; i++) out += String(sig[i] % 10);
  for (let i = 11; i < 19; i++) out += String.fromCharCode(97 + (sig[i] % 26));
  for (let i = 19; i < 22; i++) out += String.fromCharCode(65 + (sig[i] % 26));
  return out;
}

/** "/classes" -> "/classes/<key>"; deeper or unknown paths are returned unchanged. */
export async function keyedHref(userId: string, href: string, secret: string) {
  const m = href.match(/^\/([a-z][a-z-]*)$/);
  if (!m) return href;
  return `/${m[1]}/${await pageKey(userId, m[1], secret)}`;
}

/** Removes the key segment so a keyed URL can be compared with a plain route. */
export const stripKey = (path: string) => path.replace(/^(\/[a-z][a-z-]*)\/\d{11}[a-z]{8}[A-Z]{3}(?=\/|$)/, "$1");
