"use client";
import { useActionState } from "react";
import { resetPassword } from "../../join/actions";
import { FormError } from "@/components/site/join-shell";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword.bind(null, token), undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <FormError msg={state?.error} />
      <div><label className="label" htmlFor="p1">New password (8+ characters)</label><input id="p1" name="password" type="password" minLength={8} autoComplete="new-password" required className="input" /></div>
      <div><label className="label" htmlFor="p2">Repeat new password</label><input id="p2" name="confirm" type="password" minLength={8} autoComplete="new-password" required className="input" /></div>
      <button className="btn w-full" disabled={pending}>{pending ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
