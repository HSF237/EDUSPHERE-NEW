"use client";
import { useActionState, useTransition } from "react";
import { addPortion, deletePortion } from "./actions";

export function NewPortion({ classId, subjects, today }: { classId: string; subjects: { id: string; name: string }[]; today: string }) {
  const [st, action, pending] = useActionState(addPortion, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="classId" value={classId} />
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3">{st.error}</p>}
      {st?.ok && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-3">Posted. Parents of this class have been notified.</p>}
      <div><label className="label" htmlFor="ps">Subject</label><select id="ps" name="subjectId" className="input">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div><label className="label" htmlFor="pd">Date taught</label><input id="pd" name="date" type="date" defaultValue={today} max={today} className="input" required /></div>
      <div><label className="label" htmlFor="pt">Topic / chapter</label><input id="pt" name="topic" className="input" placeholder="e.g. Ch 4 — Linear equations (Ex 4.2)" required maxLength={200} /></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="pn">Notes for students & parents (optional)</label><textarea id="pn" name="notes" rows={2} className="input" maxLength={2000} placeholder="Key points covered, what to revise, what comes next…" /></div>
      <div className="text-right sm:col-span-3"><button className="btn" disabled={pending}>{pending ? "Posting…" : "Post portion"}</button></div>
    </form>
  );
}

export function DeletePortion({ id }: { id: string }) {
  const [p, start] = useTransition();
  return <button className="text-xs text-red-600 hover:underline disabled:opacity-50" disabled={p} onClick={() => start(() => deletePortion(id))}>Delete</button>;
}
