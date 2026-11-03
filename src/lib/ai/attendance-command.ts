/** Narrow, deterministic attendance grammar. Never accept a model-invented roll number. */
export type AttendanceCommand = { date: string; absent: number[]; late: number[] };

export function parseAttendanceCommand(message: string): AttendanceCommand | null {
  if (!/\b(?:mark|record|set)\b/i.test(message) || !/\broll\b|\brolls\b/i.test(message)) return null;
  const dates=[...message.matchAll(/\b(today|\d{4}-\d{2}-\d{2})\b/gi)].map(m=>m[1].toLowerCase());
  if (dates.length!==1) return null;
  const parts=[...message.matchAll(/\broll(?:s| numbers?)?\s+([0-9 ,and]+?)\s+(absent|late)\b/gi)];
  if (!parts.length || parts.length>8) return null;
  const absent:number[]=[],late:number[]=[];
  for (const part of parts) {
    const raw=part[1].trim();
    if (raw.replace(/\b(?:and)\b|[\d,\s]/gi,"").length) return null;
    const nums=[...raw.matchAll(/\d+/g)].map(m=>Number(m[0]));
    if (!nums.length || nums.some(n=>!Number.isSafeInteger(n)||n<1||n>10000)) return null;
    (part[2].toLowerCase()==="absent"?absent:late).push(...nums);
  }
  const all=[...absent,...late];
  if (all.length>100 || new Set(all).size!==all.length) return null;
  return {date:dates[0],absent:absent.sort((a,b)=>a-b),late:late.sort((a,b)=>a-b)};
}
