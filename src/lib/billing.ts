import { GRACE_DAYS } from "./plans";

export type AccessState = "COMPED" | "ACTIVE" | "GRACE" | "LOCKED" | "SETUP";
type S = { comped: boolean; compedUntil: Date | null; paidUntil: Date | null };

const DAY = 86400000;

export function accessOf(s: S, now = new Date()): { state: AccessState; until: Date | null; graceEnds: Date | null } {
  if (s.comped && (!s.compedUntil || s.compedUntil > now)) return { state: "COMPED", until: s.compedUntil, graceEnds: null };
  if (!s.paidUntil) return { state: "SETUP", until: null, graceEnds: null };
  if (s.paidUntil > now) return { state: "ACTIVE", until: s.paidUntil, graceEnds: null };
  const graceEnds = new Date(s.paidUntil.getTime() + GRACE_DAYS * DAY);
  return { state: graceEnds > now ? "GRACE" : "LOCKED", until: s.paidUntil, graceEnds };
}

/** Read-only states: reading and exporting work, changes are blocked. */
export const isReadOnly = (st: AccessState) => st === "LOCKED" || st === "SETUP";

export function addMonths(from: Date, months: number) {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}
