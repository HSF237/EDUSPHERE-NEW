"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions-auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-brand-700 to-indigo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-xl font-bold tracking-tight">EduSphere</div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">One platform for every school, teacher and parent.</h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Attendance, homework, timetables, exams, report cards, leave and messaging — with every school’s data kept separate and secure.
          </p>
        </div>
        <p className="text-sm text-indigo-200">© EduSphere</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form action={action} className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use the account your school gave you.</p>
          </div>
          {state?.error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}
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
