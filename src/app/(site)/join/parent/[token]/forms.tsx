"use client";
import { useActionState } from "react";
import { parentRegister, parentSignIn } from "../../actions";
import { FormError } from "@/components/site/join-shell";
import { PasswordInput } from "@/components/password-input";

export function ParentForms({ token, child }: { token: string; child: string }) {
  const [rs, register, rp] = useActionState(parentRegister.bind(null, token), undefined);
  const [ss, signin, sp] = useActionState(parentSignIn.bind(null, token), undefined);
  return (
    <div className="space-y-5">
      <form action={register} className="card space-y-4 p-6">
        <div><h2 className="text-lg font-extrabold text-brand-950">New to EduSphere?</h2><p className="text-sm text-slate-500">Create your parent login to see {child}’s school updates.</p></div>
        <FormError msg={rs?.error} />
        <div><label className="label" htmlFor="rn">Your full name</label><input id="rn" name="name" autoComplete="name" required className="input" /></div>
        <div><label className="label" htmlFor="re">Email</label><input id="re" name="email" type="email" autoComplete="email" required className="input" /></div>
        <div><label className="label" htmlFor="rph">Phone / WhatsApp (optional)</label><input id="rph" name="phone" type="tel" autoComplete="tel" className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="rp1">Password (8+)</label><PasswordInput id="rp1" name="password" minLength={8} autoComplete="new-password" required /></div>
          <div><label className="label" htmlFor="rp2">Repeat password</label><PasswordInput id="rp2" name="confirm" minLength={8} autoComplete="new-password" required /></div>
        </div>
        <button className="btn w-full" disabled={rp}>{rp ? "Creating…" : `Create account and add ${child}`}</button>
        <p className="text-center text-xs text-slate-500">By continuing you agree to the <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.</p>
      </form>
      <form action={signin} className="card space-y-4 p-6">
        <div><h2 className="text-lg font-extrabold text-brand-950">I already have an account</h2><p className="text-sm text-slate-500">Have another child here already? Sign in and {child} is added to the same login.</p></div>
        <FormError msg={ss?.error} />
        <div><label className="label" htmlFor="se">Email</label><input id="se" name="email" type="email" autoComplete="username" required className="input" /></div>
        <div><label className="label" htmlFor="sp">Password</label><PasswordInput id="sp" name="password" autoComplete="current-password" required /></div>
        <button className="btn-ghost w-full" disabled={sp}>{sp ? "Signing in…" : `Sign in and add ${child}`}</button>
      </form>
    </div>
  );
}
