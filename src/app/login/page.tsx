"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions-auth";
import { SceneClassroom } from "@/components/art";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="blob-bg relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 p-12 lg:flex">
        <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-brand-950">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Icon name="cap" className="h-5 w-5" /></span>EduSphere
        </div>
        <div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-lg" />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-brand-950">One platform for every school, teacher and parent.</h1>
          <p className="mt-3 max-w-md text-slate-600">Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.</p>
        </div>
        <p className="text-sm text-slate-400">© EduSphere</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form action={action} className="card w-full max-w-sm space-y-4 p-7">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with the account your school gave you.</p>
          </div>
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
        </form>
      </section>
    </main>
  );
}
