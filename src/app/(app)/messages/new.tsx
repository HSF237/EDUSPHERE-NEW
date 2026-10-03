"use client";
import { useActionState } from "react";
import { startConversation } from "./actions";

export function NewMessage({ people }: { people: { id: string; name: string; role: string }[] }) {
  const [st, action, pending] = useActionState(startConversation, undefined);
  return (
    <form action={action} className="space-y-3">
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      <div><label className="label" htmlFor="mt">To</label><select id="mt" name="to" className="input" required defaultValue=""><option value="" disabled>Select a person…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.role.toLowerCase()})</option>)}</select></div>
      <div><label className="label" htmlFor="ms">Subject</label><input id="ms" name="subject" className="input" required maxLength={120} /></div>
      <div><label className="label" htmlFor="mb">Message</label><textarea id="mb" name="body" rows={4} className="input" required maxLength={4000} /></div>
      <button className="btn" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
    </form>
  );
}
