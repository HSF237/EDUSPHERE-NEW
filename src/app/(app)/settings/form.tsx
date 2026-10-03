"use client";
import { useActionState } from "react";

export function PasswordForm({ action }: { action: (p: { error?: string; ok?: boolean } | undefined, fd: FormData) => Promise<{ error?: string; ok?: boolean }> }) {
  const [st, act, pending] = useActionState(action, undefined);
  return (
    <form action={act} className="space-y-3">
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password updated.</p>}
      <div><label className="label" htmlFor="cp">Current password</label><input id="cp" name="current" type="password" autoComplete="current-password" className="input" required /></div>
      <div><label className="label" htmlFor="np">New password</label><input id="np" name="next" type="password" autoComplete="new-password" minLength={8} className="input" required /></div>
      <button className="btn" disabled={pending}>Update password</button>
    </form>
  );
}
