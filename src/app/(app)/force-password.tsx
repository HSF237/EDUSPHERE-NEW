"use client";
import { useActionState } from "react";
import { forcePasswordChange } from "./force-password-action";
import { PasswordInput } from "@/components/password-input";

export function ForcePassword({ name }: { name: string }) {
  const [state, action, pending] = useActionState(forcePasswordChange, undefined);
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-sun-50 px-5">
      <form action={action} className="card w-full max-w-sm space-y-4 p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="mb-1 h-9 w-auto" />
        <div>
          <h1 className="text-xl font-extrabold text-brand-950">Choose your own password</h1>
          <p className="mt-1 text-sm text-slate-500">Hi {name.split(" ")[0]}, your account was set up with a temporary password. Please pick a new one before you continue.</p>
        </div>
        {state?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
        <div><label className="label" htmlFor="np">New password</label><PasswordInput id="np" name="next" autoComplete="new-password" minLength={8} required /></div>
        <div><label className="label" htmlFor="np2">Repeat new password</label><PasswordInput id="np2" name="confirm" autoComplete="new-password" minLength={8} required /></div>
        <p className="text-xs text-slate-500">At least 8 characters. Don’t reuse the temporary one.</p>
        <button className="btn w-full" disabled={pending}>{pending ? "Saving…" : "Save and continue"}</button>
      </form>
    </main>
  );
}
