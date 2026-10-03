"use client";
import { useActionState, useTransition } from "react";
import { applyLeave, decideLeave } from "./actions";

export function ApplyLeave({ kids }: { kids: { id: string; name: string }[] }) {
  const [st, action, pending] = useActionState(applyLeave, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      {st?.error && <p role="alert" className="sm:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p role="status" className="sm:col-span-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Leave request sent to the school.</p>}
      <div><label className="label" htmlFor="ls">Child</label><select id="ls" name="studentId" className="input">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></div>
      <div><label className="label" htmlFor="lf">From</label><input id="lf" name="fromDate" type="date" className="input" required /></div>
      <div><label className="label" htmlFor="lt">To</label><input id="lt" name="toDate" type="date" className="input" required /></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="lr">Reason</label><textarea id="lr" name="reason" rows={3} className="input" required maxLength={500} /></div>
      <div className="sm:col-span-3 text-right"><button className="btn" disabled={pending}>{pending ? "Sending…" : "Submit request"}</button></div>
    </form>
  );
}

export function Decide({ id }: { id: string }) {
  const [p, start] = useTransition();
  return (<div className="flex gap-2"><button className="btn" disabled={p} onClick={() => start(() => decideLeave(id, true))}>Approve</button><button className="btn-ghost" disabled={p} onClick={() => start(() => decideLeave(id, false))}>Decline</button></div>);
}
