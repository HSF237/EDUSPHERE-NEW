"use client";
import { useActionState } from "react";
import { studentRegister } from "../../actions";
import { FormError } from "@/components/site/join-shell";
import { PasswordInput } from "@/components/password-input";
export function StudentForm({token}:{token:string}) {
  const [state,action,pending]=useActionState(studentRegister.bind(null,token),undefined);
  return <form action={action} className="card space-y-4 p-6"><FormError msg={state?.error}/><p className="text-sm text-slate-600">Create your own login for homework and learning help.</p><div><label htmlFor="student-email" className="label">Email</label><input id="student-email" name="email" type="email" maxLength={200} autoComplete="email" required className="input"/></div><div><label htmlFor="student-password" className="label">Password (8+ characters)</label><PasswordInput id="student-password" name="password" minLength={8} maxLength={200} required autoComplete="new-password"/></div><div><label htmlFor="student-confirm" className="label">Repeat password</label><PasswordInput id="student-confirm" name="confirm" minLength={8} maxLength={200} required autoComplete="new-password"/></div><button className="btn w-full" disabled={pending}>{pending?"Creating your account…":"Create student account"}</button><p className="text-xs text-slate-500">By continuing you agree to the <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.</p></form>;
}
