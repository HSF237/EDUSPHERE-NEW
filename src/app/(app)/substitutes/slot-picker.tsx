"use client";
import { useMemo, useState } from "react";

export type SlotOpt = { id: string; day: number; period: number; cls: string; subject: string; teacher: string; teacherId: string };
const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Filterable "period to cover" picker — keeps big timetables manageable. */
export function SlotPicker({ slots, onDay }: { slots: SlotOpt[]; onDay?: (d: number | null) => void }) {
  const [teacher, setTeacher] = useState("");
  const [cls, setCls] = useState("");
  const [day, setDay] = useState("");
  const [q, setQ] = useState("");
  const teachers = useMemo(() => [...new Map(slots.map((s) => [s.teacherId, s.teacher])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [slots]);
  const classes = useMemo(() => [...new Set(slots.map((s) => s.cls))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [slots]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return slots.filter((s) => (!teacher || s.teacherId === teacher) && (!cls || s.cls === cls) && (day === "" || s.day === Number(day)) && (!n || `${s.subject} ${s.teacher} ${s.cls}`.toLowerCase().includes(n)));
  }, [slots, teacher, cls, day, q]);
  const reset = teacher || cls || day || q;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="input" aria-label="Filter by absent teacher"><option value="">All teachers</option>{teachers.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <select value={cls} onChange={(e) => setCls(e.target.value)} className="input" aria-label="Filter by class"><option value="">All classes</option>{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={day} onChange={(e) => setDay(e.target.value)} className="input" aria-label="Filter by day"><option value="">Any day</option>{DAY.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject…" className="input" aria-label="Search" />
      </div>
      <select id="ss" name="slotId" className="input mt-2" required aria-label="Period to cover">
        {list.length === 0 && <option value="">No periods match</option>}
        {list.map((s) => <option key={s.id} value={s.id}>{DAY[s.day]} P{s.period} · {s.cls} · {s.subject} ({s.teacher})</option>)}
      </select>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{list.length} of {slots.length} periods</span>
        {reset && <button type="button" className="font-medium text-brand-600 hover:underline" onClick={() => { setTeacher(""); setCls(""); setDay(""); setQ(""); }}>Clear filters</button>}
      </div>
    </div>
  );
}
