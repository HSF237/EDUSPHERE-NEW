"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions-auth";

export type LoginText = {
  welcome: string; sub: string; email: string; password: string; signIn: string; signingIn: string; forgot: string;
  create: string; agree: string; terms: string; and: string; privacy: string; home: string; reset: string;
};

function ResetBanner({ text }: { text: string }) {
  const q = useSearchParams();
  if (q.get("reset") !== "1") return null;
  return <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{text}</div>;
}

export function LoginForm({ t }: { t: LoginText }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="card w-full space-y-4 p-7">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">{t.welcome}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.sub}</p>
      </div>
      <Suspense><ResetBanner text={t.reset} /></Suspense>
      {state?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button className="btn w-full" disabled={pending}>{pending ? t.signingIn : t.signIn}</button>
      <p className="text-center text-xs text-slate-500">{t.forgot}</p>
      <p className="text-center text-sm font-semibold"><Link className="text-brand-700 underline" href="/register-school">{t.create}</Link></p>
      <p className="text-center text-xs text-slate-500">{t.agree} <Link className="font-semibold text-brand-700 underline" href="/terms">{t.terms}</Link> {t.and} <Link className="font-semibold text-brand-700 underline" href="/privacy">{t.privacy}</Link>. <Link className="underline" href="/">{t.home}</Link></p>
    </form>
  );
}
