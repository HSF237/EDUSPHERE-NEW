import { createHash } from "node:crypto";
import { z } from "zod";

export class AgentError extends Error {}
export function hash(value: unknown): string {
  // PostgreSQL JSONB may reorder object keys; approval hashes must survive that.
  const serialized=JSON.stringify(value,(_key,v)=>v && typeof v==="object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);
  return createHash("sha256").update(serialized).digest("hex");
}
export function localDay(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (t: string) => parts.find(p => p.type === t)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function exactDate(request: string, phrase: string, timezone: string, now = new Date()): string {
  const values = [...request.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g), ...request.toLowerCase().matchAll(/\b(today|tomorrow|yesterday)\b/g)].map(m => m[0]);
  if (!values.length || new Set(values).size !== 1 || values[0] !== phrase) throw new AgentError("Please provide one date: today, tomorrow, or YYYY-MM-DD.");
  const offsets: Record<string, number> = { today: 0, tomorrow: 1, yesterday: -1 };
  const day = phrase in offsets ? new Date(`${localDay(now, timezone)}T00:00:00Z`) : new Date(`${phrase}T00:00:00Z`);
  if (!Number.isFinite(+day) || (!(phrase in offsets) && day.toISOString().slice(0, 10) !== phrase)) throw new AgentError("The date is invalid.");
  if (phrase in offsets) day.setUTCDate(day.getUTCDate() + offsets[phrase]);
  return day.toISOString().slice(0, 10);
}
export function utcDay(day: string): Date { return new Date(`${day}T00:00:00Z`); }
export function exactTeacher(request: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "u").test(request)) throw new AgentError("Please use the teacher’s exact name from EduSphere.");
}
export function exactAbsence(request: string, name: string) {
  exactTeacher(request,name);
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  // Keep this narrow: an unrelated teacher name or a negative statement cannot become an absence.
  if (!new RegExp(`${escaped}\\s+(?:(?:is|will be)\\s+)?(?:absent|unavailable)\\b`,"u").test(request)) throw new AgentError("Please explicitly state the absent teacher, for example: Mrs. Fathima is absent tomorrow.");
}
export const classCode = z.string().regex(/^(?:1[0-2]|[1-9])[A-Z]{1,2}$/);
export function exactClasses(request: string, codes: string[]) {
  const mentioned = [...request.matchAll(/\b(?:1[0-2]|[1-9])[A-Z]{1,2}\b/g)].map(m => m[0]);
  if (codes.length !== new Set(codes).size || !codes.length || codes.some(c => !classCode.safeParse(c).success) || [...new Set(mentioned)].sort().join() !== [...codes].sort().join()) throw new AgentError("Please name every division explicitly, for example 8A, 8B, 8C and 8D.");
  const grades = [...request.matchAll(/\b(?:Class|Grade)\s+(1[0-2]|[1-9])\b/gi)].map(m => Number(m[1]));
  if (grades.length && codes.some(c => !grades.includes(Number(c.match(/^\d+/)![0])))) throw new AgentError("The grade conflicts with the named divisions.");
  const words: Record<string,number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const counts = [...request.matchAll(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:new\s+)?(?:Class\s+\d+\s+)?(?:classes|divisions)\b/gi)].map(m => words[m[1].toLowerCase()] ?? Number(m[1]));
  if (counts.some(n => n !== codes.length)) throw new AgentError("The number of divisions does not match your request.");
}
export function exactClass(request: string, code: string) { exactClasses(request, [code]); }
export function exactYear(request: string, phrase: string, activeName: string) {
  const years = [...request.matchAll(/\b\d{4}[-–]\d{2,4}\b/g)].map(m => m[0]);
  if (years.length ? years.some(y => y !== phrase) : phrase !== "active") throw new AgentError("Academic year changed. Use the current year or specify it explicitly.");
  if (phrase !== "active" && phrase !== activeName) throw new AgentError("Only the current academic year is supported for class creation.");
  return activeName;
}
export function minutes(value: string): number {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new AgentError("A timetable time is invalid. Fix it before planning substitutes.");
  const [h,m] = value.split(":").map(Number);
  if (h > 23 || m > 59) throw new AgentError("A timetable time is invalid.");
  return h * 60 + m;
}
export type Interval = { startTime: string; endTime: string };
export function overlap(a: Interval, b: Interval): boolean {
  const startA = minutes(a.startTime), endA = minutes(a.endTime), startB = minutes(b.startTime), endB = minutes(b.endTime);
  if (endA <= startA || endB <= startB) throw new AgentError("Timetable periods must have valid start and end times.");
  return startA < endB && startB < endA;
}
