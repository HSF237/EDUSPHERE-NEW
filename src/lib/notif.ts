/** Notification categories and each person's own settings (stored in User.notifPrefs). */
export const KINDS = [
  { id: "chat", label: "Chat messages", paths: ["/messages"] },
  { id: "attendance", label: "Attendance and leave", paths: ["/attendance", "/leave"] },
  { id: "classwork", label: "Homework and portions", paths: ["/homework", "/portions", "/diary"] },
  { id: "exams", label: "Exams and results", paths: ["/exams"] },
  { id: "fees", label: "Fees and payments", paths: ["/fees"] },
  { id: "notices", label: "Announcements, meetings and substitutions", paths: ["/announcements", "/ptm", "/substitutes"] },
] as const;

export type Prefs = { off: string[]; quiet: { from: string; to: string } | null; sound: boolean };
export const DEFAULT_PREFS: Prefs = { off: [], quiet: null, sound: true };
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parsePrefs(j: unknown): Prefs {
  const o = (j && typeof j === "object" ? j : {}) as Partial<Prefs>;
  const ids: string[] = KINDS.map((k) => k.id);
  const q = o.quiet && TIME.test(o.quiet.from) && TIME.test(o.quiet.to) ? { from: o.quiet.from, to: o.quiet.to } : null;
  return { off: Array.isArray(o.off) ? o.off.filter((x) => ids.includes(x)) : [], quiet: q, sound: o.sound !== false };
}

/** "other" (account, billing and school alerts) is not a switchable category. */
export function kindOf(link?: string | null): string {
  const path = (link ?? "").split("?")[0];
  return KINDS.find((k) => k.paths.some((p) => path === p || path.startsWith(p + "/")))?.id ?? "other";
}

const TZ = "Asia/Kolkata";
function minutes(now: Date) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(now).split(":").map(Number);
  return (h % 24) * 60 + m;
}
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export function inQuiet(p: Prefs, now = new Date()) {
  if (!p.quiet) return false;
  const n = minutes(now), a = mins(p.quiet.from), b = mins(p.quiet.to);
  if (a === b) return false;
  return a < b ? n >= a && n < b : n >= a || n < b;
}

/** Should this person be interrupted (push / pop-up) right now? The in-app list always keeps everything. */
export function wantsAlert(p: Prefs, kind: string, now = new Date()) {
  if (kind !== "other" && p.off.includes(kind)) return false;
  return !inQuiet(p, now);
}
