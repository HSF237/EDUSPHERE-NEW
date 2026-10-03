"use client";
import { useActionState, useState, useTransition } from "react";
import { createExam, saveMarks, setPublished } from "./actions";

export function NewExam({ classes }: { classes: { id: string; name: string }[] }) {
  const [st, action, pending] = useActionState(createExam, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-5">
      {st?.error && <p role="alert" className="sm:col-span-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p role="status" className="sm:col-span-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Exam created with a schedule for every subject.</p>}
      <div><label className="label" htmlFor="ec">Class</label><select id="ec" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="en">Exam name</label><input id="en" name="name" className="input" required placeholder="Mid-term" /></div>
      <div><label className="label" htmlFor="em">Max marks</label><input id="em" name="maxMarks" type="number" defaultValue={100} className="input" required /></div>
      <div><label className="label" htmlFor="ep">Pass marks</label><input id="ep" name="passMarks" type="number" defaultValue={35} className="input" required /></div>
      <div><label className="label" htmlFor="ed">Starts on</label><input id="ed" name="startsOn" type="date" className="input" required /></div>
      <div className="sm:col-span-4 text-right sm:col-start-2"><button className="btn" disabled={pending}>{pending ? "Creating…" : "Create exam"}</button></div>
    </form>
  );
}

export function MarksEntry({ examId, subjectId, max, rows }: { examId: string; subjectId: string; max: number; rows: { id: string; name: string; rollNo: number; score: string }[] }) {
  const [v, setV] = useState(Object.fromEntries(rows.map((r) => [r.id, r.score])));
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [p, start] = useTransition();
  const submit = () => {
    const entries = rows.filter((r) => v[r.id] !== "").map((r) => ({ studentId: r.id, score: Number(v[r.id]) }));
    if (entries.some((e) => Number.isNaN(e.score) || e.score < 0 || e.score > max)) return setMsg({ ok: false, t: `Each mark must be between 0 and ${max}.` });
    start(async () => { const r = await saveMarks({ examId, subjectId, entries }); setMsg("error" in r && r.error ? { ok: false, t: r.error } : { ok: true, t: "Marks saved." }); });
  };
  return (
    <div>
      <ul className="divide-y divide-slate-100">{rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-5 py-2 text-sm"><label htmlFor={`m${r.id}`}><span className="mr-3 text-slate-400">{r.rollNo}</span>{r.name}</label>
          <div className="flex items-center gap-2"><input id={`m${r.id}`} type="number" min={0} max={max} step="0.5" value={v[r.id]} onChange={(e) => setV({ ...v, [r.id]: e.target.value })} className="input w-24 text-right" /><span className="text-xs text-slate-400">/ {max}</span></div></li>))}</ul>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3"><p role="status" className={`text-sm ${msg?.ok ? "text-emerald-600" : "text-red-600"}`}>{msg?.t}</p><button className="btn" onClick={submit} disabled={p}>{p ? "Saving…" : "Save marks"}</button></div>
    </div>
  );
}

export function PublishButton({ examId, published }: { examId: string; published: boolean }) {
  const [p, start] = useTransition();
  return <button className={published ? "btn-ghost" : "btn"} disabled={p} onClick={() => start(() => setPublished(examId, !published))}>{published ? "Unpublish results" : "Publish results"}</button>;
}
