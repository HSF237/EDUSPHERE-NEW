"use client";
import { useActionState } from "react";
import { registerSchool } from "./actions";
import { FormError } from "@/components/site/join-shell";
import { PasswordInput } from "@/components/password-input";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerSchool, undefined);
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <FormError msg={state?.error} />
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-brand-600">Your school</legend>
        <div><label className="label" htmlFor="school">School name</label><input id="school" name="school" required minLength={3} className="input" placeholder="e.g. Green Valley Public School" /></div>
        <div><label className="label" htmlFor="address">City / address (optional)</label><input id="address" name="address" className="input" /></div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-brand-600">Principal account</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="name">Principal’s name</label><input id="name" name="name" autoComplete="name" required className="input" /></div>
          <div><label className="label" htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" /></div>
        </div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pw">Password (8+ characters)</label><PasswordInput id="pw" name="password" minLength={8} autoComplete="new-password" required /></div>
          <div><label className="label" htmlFor="pw2">Repeat password</label><PasswordInput id="pw2" name="confirm" minLength={8} autoComplete="new-password" required /></div>
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" name="agree" className="mt-1 h-4 w-4 accent-indigo-600" required /><span>I agree to the <a className="font-semibold text-brand-700 underline" href="/terms" target="_blank">Terms &amp; Conditions</a> and <a className="font-semibold text-brand-700 underline" href="/privacy" target="_blank">Privacy Policy</a>, and confirm I’m authorised to set up this school.</span></label>
      <button className="btn w-full !py-3 text-base" disabled={pending}>{pending ? "Creating your school…" : "Create my school"}</button>
    </form>
  );
}
