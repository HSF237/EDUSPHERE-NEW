"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions-auth";
import { SceneClassroom } from "@/components/art";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetBanner() {
  const q = useSearchParams();
  if (q.get("reset") !== "1") return null;
  return <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Password updated. Please sign in.</div>;
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="blob-bg relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 p-12 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="h-12 w-auto self-start" />
        <div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-lg" />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-brand-950">One platform for every school, teacher and parent.</h1>
          <p className="mt-3 max-w-md text-slate-600">Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.</p>
        </div>
        <p className="text-sm text-slate-400">© EduSphere · <Link className="hover:underline" href="/terms">Terms</Link> · <Link className="hover:underline" href="/privacy">Privacy</Link></p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex justify-end"><LangSwitch /></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="mx-auto mb-5 h-10 w-auto lg:hidden" />
        <form action={action} className="card w-full space-y-4 p-7">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with the account your school gave you.</p>
          </div>
          <Suspense><ResetBanner /></Suspense>
          {state?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
          <p className="text-center text-xs text-slate-500">Forgot your password? Ask your principal or class teacher for a reset link.</p>
          <p className="text-center text-sm font-semibold"><Link className="text-brand-700 underline" href="/register-school">Create your school</Link></p>
          <p className="text-center text-xs text-slate-500">By signing in you agree to our <Link className="font-semibold text-brand-700 underline" href="/terms">Terms</Link> and <Link className="font-semibold text-brand-700 underline" href="/privacy">Privacy Policy</Link>. <Link className="underline" href="/">Back to home</Link></p>
        </form>
        </div>
      </section>
    </main>
  );
}
