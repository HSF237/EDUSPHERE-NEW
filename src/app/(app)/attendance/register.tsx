"use client";
import { useState, useTransition } from "react";
import { saveAttendance } from "./actions";

type Row = { id: string; name: string; rollNo: number; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" };
const OPTS = [["PRESENT", "P", "bg-emerald-600"], ["ABSENT", "A", "bg-red-600"], ["LATE", "L", "bg-amber-500"], ["EXCUSED", "E", "bg-blue-600"]] as const;

export function Register({ classId, date, rows, locked }: { classId: string; date: string; rows: Row[]; locked: boolean }) {
  const [state, setState] = useState(rows);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (id: string, status: Row["status"]) => setState((s) => s.map((r) => (r.id === id ? { ...r, status } : r)));
  const all = (status: Row["status"]) => setState((s) => s.map((r) => ({ ...r, status })));
  const counts = OPTS.map(([k]) => state.filter((r) => r.status === k).length);
  const submit = () =>
    start(async () => {
      const res = await saveAttendance({ classId, date, entries: state.map((r) => ({ studentId: r.id, status: r.status })) });
      setMsg("error" in res && res.error ? { ok: false, text: res.error } : { ok: true, text: "Attendance saved and sent for approval." });
    });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm">
        <div className="flex gap-4">
          {OPTS.map(([k], i) => <span key={k}><b>{counts[i]}</b> <span className="text-slate-500">{k.toLowerCase()}</span></span>)}
        </div>
        {!locked && <button type="button" className="btn-ghost" onClick={() => all("PRESENT")}>Mark all present</button>}
      </div>
      <ul className="divide-y divide-slate-100">
        {state.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-5 py-2.5">
            <span className="text-sm"><span className="mr-3 inline-block w-6 text-slate-400">{r.rollNo}</span>{r.name}</span>
            <div className="flex gap-1" role="group" aria-label={`Attendance for ${r.name}`}>
              {OPTS.map(([k, l, c]) => (
                <button key={k} type="button" disabled={locked} aria-pressed={r.status === k} aria-label={k.toLowerCase()} onClick={() => set(r.id, k)}
                  className={`h-8 w-8 rounded-md text-xs font-semibold ${r.status === k ? `${c} text-white` : "bg-slate-100 text-slate-600 hover:bg-slate-200"} disabled:opacity-60`}>{l}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <p role="status" className={`text-sm ${msg?.ok ? "text-emerald-600" : "text-red-600"}`}>{msg?.text}</p>
        {!locked && <button className="btn" onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save attendance"}</button>}
      </div>
    </div>
  );
}
