"use client";
import { useActionState, useRef } from "react";

type State = { error?: string; ok?: string } | undefined;

/** Small "choose a file and upload" form for a bound server action. */
export function UploadForm({ action, label, button, accept, field = "file" }: { action: (p: State, fd: FormData) => Promise<State>; label: string; button: string; accept: string; field?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [st, run, pending] = useActionState(async (p: State, fd: FormData) => { const r = await action(p, fd); if (r?.ok) ref.current?.reset(); return r; }, undefined);
  return (
    <form ref={ref} action={run} className="space-y-2">
      <label className="label">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input name={field} type="file" accept={accept} required className="input !py-2 max-w-xs" />
        <button className="btn-ghost" disabled={pending}>{pending ? "Uploading…" : button}</button>
      </div>
      {st?.error && <p role="alert" className="text-xs text-red-600">{st.error}</p>}
      {st?.ok && <p role="status" className="text-xs text-emerald-700">{st.ok}</p>}
    </form>
  );
}
