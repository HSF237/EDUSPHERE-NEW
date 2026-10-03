"use client";
import { useActionState, useRef } from "react";
import { createFeeItem, recordPayment, sendAllReminders } from "./actions";

type State = { error?: string; ok?: string } | undefined;
const Msg = ({ s }: { s: State }) => <>{s?.error && <p role="alert" className="sm:col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{s.error}</p>}{s?.ok && <p role="status" className="sm:col-span-full rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{s.ok}</p>}</>;

export function FeeItemForm({ classes }: { classes: { id: string; name: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [st, run, pending] = useActionState(async (p: State, fd: FormData) => { const r = await createFeeItem(p, fd); if (r?.ok) ref.current?.reset(); return r; }, undefined);
  return (
    <form ref={ref} action={run} className="grid gap-3 sm:grid-cols-4">
      <Msg s={st} />
      <div className="sm:col-span-2"><label className="label" htmlFor="fn">Fee name</label><input id="fn" name="name" required maxLength={80} className="input" placeholder="Term 1 tuition" /></div>
      <div><label className="label" htmlFor="fa">Amount (₹)</label><input id="fa" name="amount" type="number" min={1} required className="input" /></div>
      <div><label className="label" htmlFor="fd">Due date</label><input id="fd" name="dueOn" type="date" required className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="fc">Applies to</label><select id="fc" name="classId" className="input"><option value="">Every class</option>{classes.map((c) => <option key={c.id} value={c.id}>Class {c.name}</option>)}</select></div>
      <div className="flex items-end sm:col-span-2 sm:justify-end"><button className="btn" disabled={pending}>{pending ? "Adding…" : "Add fee"}</button></div>
    </form>
  );
}

export function PaymentForm({ studentId, modes, items, today }: { studentId: string; modes: readonly string[]; items: { id: string; label: string }[]; today: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [st, run, pending] = useActionState(async (p: State, fd: FormData) => { const r = await recordPayment(studentId, p, fd); if (r?.ok) ref.current?.reset(); return r; }, undefined);
  return (
    <form ref={ref} action={run} className="grid gap-3 sm:grid-cols-3">
      <Msg s={st} />
      <div><label className="label" htmlFor="pa">Amount (₹)</label><input id="pa" name="amount" type="number" min={1} required className="input" /></div>
      <div><label className="label" htmlFor="pm">Mode</label><select id="pm" name="mode" className="input">{modes.map((m) => <option key={m}>{m}</option>)}</select></div>
      <div><label className="label" htmlFor="pd">Date</label><input id="pd" name="paidOn" type="date" defaultValue={today} max={today} required className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="pi">Towards</label><select id="pi" name="itemId" className="input"><option value="">Oldest dues first</option>{items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></div>
      <div><label className="label" htmlFor="pr">Reference (UPI id / cheque no.)</label><input id="pr" name="reference" maxLength={60} className="input" /></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="pn">Note (required for a waiver)</label><input id="pn" name="note" maxLength={200} className="input" /></div>
      <div className="sm:col-span-3 text-right"><button className="btn" disabled={pending}>{pending ? "Saving…" : "Record payment & make receipt"}</button></div>
    </form>
  );
}

export function RemindAll() {
  const [st, run, pending] = useActionState(async () => sendAllReminders(), undefined as State);
  return (
    <form action={run} className="flex flex-wrap items-center gap-3">
      <button className="btn-ghost" disabled={pending}>{pending ? "Preparing…" : "Remind everyone overdue"}</button>
      {st?.ok && <span role="status" className="text-xs text-emerald-700">{st.ok}</span>}
      {st?.error && <span role="alert" className="text-xs text-red-600">{st.error}</span>}
    </form>
  );
}
