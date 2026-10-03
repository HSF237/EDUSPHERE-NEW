"use client";
import { useActionState, useState } from "react";
import { joinAsTeacher } from "../../actions";
import { FormError } from "@/components/site/join-shell";

type Cls = { id: string; name: string; taken: string | null };
type Sub = { id: string; name: string };

export function TeacherJoinForm({ token, school, classes, subjects }: { token: string; school: string; classes: Cls[]; subjects: Sub[] }) {
  const [state, action, pending] = useActionState(joinAsTeacher.bind(null, token), undefined);
  const [type, setType] = useState<"CLASS" | "SUBJECT" | "BOTH">("SUBJECT");
  const wantsClass = type === "CLASS" || type === "BOTH", wantsSubject = type === "SUBJECT" || type === "BOTH";
  const free = classes.filter((c) => !c.taken);
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <FormError msg={state?.error} />
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-brand-600">About you</legend>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required className="input" /></div>
        <div><label className="label" htmlFor="email">Email (Gmail or any email)</label><input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@gmail.com" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" /></div>
          <div><label className="label" htmlFor="q">Qualification</label><input id="q" name="qualification" className="input" placeholder="e.g. M.Sc Maths, B.Ed" /></div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-brand-600">Your role at {school}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {([["CLASS", "Class teacher", "I look after one class"], ["SUBJECT", "Subject teacher", "I teach subjects in classes"], ["BOTH", "Both", "Class teacher and subjects"]] as const).map(([v, t, d]) => (
            <label key={v} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${type === v ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
              <span className="block font-semibold text-brand-950">{t}</span><span className="text-xs text-slate-500">{d}</span>
            </label>
          ))}
        </div>
        {wantsClass && (
          <div>
            <label className="label" htmlFor="cto">I am the class teacher of</label>
            {free.length === 0 ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Every class already has a class teacher. Choose “Subject teacher”, or ask your principal.</p> : (
              <select id="cto" name="classTeacherOf" required className="input" defaultValue=""><option value="" disabled>Choose a class…</option>{classes.map((c) => <option key={c.id} value={c.id} disabled={!!c.taken}>{c.name}{c.taken ? ` — taken by ${c.taken}` : ""}</option>)}</select>
            )}
          </div>
        )}
        {wantsSubject && (
          <>
            <div>
              <p className="label">Subjects I teach</p>
              {subjects.length === 0 ? <p className="text-sm text-slate-500">No subjects have been set up yet — ask your principal.</p> : <div className="grid gap-2 sm:grid-cols-2">{subjects.map((s) => <label key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="subjectIds" value={s.id} className="h-4 w-4 accent-indigo-600" />{s.name}</label>)}</div>}
            </div>
            <div>
              <p className="label">…in these classes</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{classes.map((c) => <label key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="classIds" value={c.id} className="h-4 w-4 accent-indigo-600" />{c.name}</label>)}</div>
              <p className="mt-1 text-xs text-slate-500">If a subject in a class already has a teacher, it is skipped and your principal is told.</p>
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-brand-600">Choose a password</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pw">Password (8+ characters)</label><input id="pw" name="password" type="password" minLength={8} autoComplete="new-password" required className="input" /></div>
          <div><label className="label" htmlFor="pw2">Repeat password</label><input id="pw2" name="confirm" type="password" minLength={8} autoComplete="new-password" required className="input" /></div>
        </div>
      </fieldset>

      <button className="btn w-full !py-3 text-base" disabled={pending}>{pending ? "Creating your account…" : "Create my teacher account"}</button>
      <p className="text-center text-xs text-slate-500">By continuing you agree to the <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}
