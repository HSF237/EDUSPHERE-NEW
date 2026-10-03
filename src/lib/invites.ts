import { randomBytes } from "crypto";
import { db } from "./db";
import { SITE } from "./site";

/** 192-bit random, URL-safe. Unguessable; the only thing that grants access. */
export const newToken = () => randomBytes(24).toString("base64url");

export const DAY = 24 * 60 * 60 * 1000;
export const joinPath = (kind: "TEACHER" | "PARENT" | "RESET", token: string) =>
  kind === "TEACHER" ? `/join/teacher/${token}` : kind === "PARENT" ? `/join/parent/${token}` : `/reset/${token}`;
export const absUrl = (path: string) => `${process.env.NEXT_PUBLIC_SITE_URL || SITE.url}${path}`;

export type InviteState = "ok" | "expired" | "used" | "revoked";
export const inviteState = (i: { expiresAt: Date; uses: number; maxUses: number; revokedAt: Date | null }, now = new Date()): InviteState =>
  i.revokedAt ? "revoked" : i.expiresAt <= now ? "expired" : i.uses >= i.maxUses ? "used" : "ok";

export async function loadInvite(token: string, kind: "TEACHER" | "PARENT" | "RESET") {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const inv = await db.invite.findUnique({ where: { token }, include: { school: true, student: { include: { class: true } }, user: true } });
  if (!inv || inv.kind !== kind) return null;
  return { inv, state: inviteState(inv) };
}

export const STATE_TEXT: Record<Exclude<InviteState, "ok">, string> = {
  expired: "This link has expired. Ask your school for a new one.",
  used: "This link has already been used. Ask your school for a new one.",
  revoked: "This link was cancelled by the school. Ask them for a new one.",
};
