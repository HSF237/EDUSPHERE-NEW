"use client";
import { useState } from "react";
import { PERMS, PRESETS, type Perm } from "@/lib/perms";

type Cls = { id: string; name: string; current: string | null };

export function AccessForm({ action, position, perms, classes, mine }: {
  action: (fd: FormData) => Promise<void>; position: string; perms: Perm[]; classes: Cls[]; mine: string[];
}) {
  const [pos, setPos] = useState(position);
  const [on, setOn] = useState<Set<Perm>>(new Set(perms));
  const toggle = (k: Perm) => setOn((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <form action={action} className="space-y-6">
      <div>
        <label className="label" htmlFor="pos">Position / title</label>
        <input id="pos" name="position" value={pos} onChange={(e) => setPos(e.target.value)} maxLength={60} placeholder="e.g. Section Head, Exam Coordinator" className="input" />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Position presets">
          {PRESETS.map((p) => (
            <button type="button" key={p.position} onClick={() => { setPos(p.position); setOn(new Set(p.perms)); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${pos === p.position ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:ring-brand-300"}`}>{p.position}</button>
          ))}
          <button type="button" onClick={() => { setPos(""); setOn(new Set()); }} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 hover:text-red-600">Clear</button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">A preset fills in the title and a sensible set of access — you can still change every switch below.</p>
      </div>

      <fieldset>
        <legend className="label">Access</legend>
        <ul className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
          {PERMS.map((p) => {
            const checked = on.has(p.key);
            return (
              <li key={p.key}>
                <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">{p.label}</span><span className="block text-xs text-slate-500">{p.hint}</span></span>
                  <input type="checkbox" name="perm" value={p.key} checked={checked} onChange={() => toggle(p.key)} className="peer sr-only" />
                  <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2 ${checked ? "bg-brand-600" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="label">Class teacher of</legend>
        <p className="mb-2 text-xs text-slate-500">Tick the classes this teacher leads. They get the full class-teacher workspace (attendance, leave, diary, students) for each. A class has one class teacher — ticking a class that already has one replaces them.</p>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {classes.map((c) => (
            <label key={c.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-slate-200 has-[:checked]:bg-brand-50 has-[:checked]:ring-brand-400">
              <input type="checkbox" name="homeroom" value={c.id} defaultChecked={mine.includes(c.id)} className="h-4 w-4 accent-brand-600" />
              <span className="text-sm font-semibold">{c.name}{c.current && !mine.includes(c.id) && <span className="block text-[11px] font-normal text-slate-500">now: {c.current}</span>}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="text-right"><button className="btn">Save position & access</button></div>
    </form>
  );
}
