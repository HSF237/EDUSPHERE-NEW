"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions-auth";
import { PasswordInput } from "@/components/password-input";

export type LoginText = {
  welcome: string; sub: string; email: string; pwLabel: string; signIn: string; signingIn: string; forgot: string;
  create: string; agree: string; terms: string; and: string; privacy: string; home: string; reset: string;
};

function ResetBanner({ text }: { text: string }) {
  const q = useSearchParams();
  if (q.get("reset") !== "1") return null;
  return <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{text}</div>;
}

function OAuthNotice({ messages }: { messages: Record<string, string> }) {
  const q = useSearchParams();
  const code = q.get("oauth");
  if (!code) return null;
  const message = messages[code];
  if (!message) return null;
  return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</div>;
}

export type OAuthProvider = { id: string; label: string; href: string };

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/** Neutral mark until OpenAI's branding assets apply (the button stays hidden until configured). */
const ChatGptIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

export function LoginForm({
  t,
  hideCreate,
  providers = [],
  oauthErrors = {},
  orLabel = "or",
}: {
  t: LoginText;
  hideCreate?: boolean;
  providers?: OAuthProvider[];
  oauthErrors?: Record<string, string>;
  orLabel?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="card w-full space-y-4 p-7">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">{t.welcome}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.sub}</p>
      </div>
      <Suspense><ResetBanner text={t.reset} /></Suspense>
      <Suspense><OAuthNotice messages={oauthErrors} /></Suspense>
      {state?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.pwLabel}</label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <button className="btn w-full" disabled={pending}>{pending ? t.signingIn : t.signIn}</button>
      {providers.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="relative py-1 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" aria-hidden="true" />
            <span className="relative bg-white px-2 text-xs font-medium text-slate-400">{orLabel}</span>
          </div>
          {providers.map((p) => (
            <a key={p.id} href={p.href} className="btn-ghost w-full">
              {p.id === "google" ? <GoogleIcon /> : p.id === "chatgpt" ? <ChatGptIcon /> : null}
              {p.label}
            </a>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-slate-500">{t.forgot}</p>
      {!hideCreate && <p className="text-center text-sm font-semibold"><Link className="text-brand-700 underline" href="/register-school">{t.create}</Link></p>}
      <p className="text-center text-xs text-slate-500">{t.agree} <Link className="font-semibold text-brand-700 underline" href="/terms">{t.terms}</Link> {t.and} <Link className="font-semibold text-brand-700 underline" href="/privacy">{t.privacy}</Link>. <Link className="underline" href="/">{t.home}</Link></p>
    </form>
  );
}
