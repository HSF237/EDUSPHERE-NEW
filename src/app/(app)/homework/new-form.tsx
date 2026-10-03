"use client";
import { useActionState } from "react";
import { createHomework } from "./actions";
import { ACCEPT_ALL } from "@/lib/fileTypes";

type Opt = { id: string; name: string };
export function NewHomework({ classes, subjectsByClass }: { classes: Opt[]; subjectsByClass: Record<string, Opt[]> }) {
  const [st, action, pending] = useActionState(createHomework, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {st?.error && <p role="alert" className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      <div><label className="label" htmlFor="hc">Class</label><select id="hc" name="classId" className="input" required>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label className="label" htmlFor="hs">Subject</label><select id="hs" name="subjectId" className="input" required>
        {Array.from(new Map(Object.values(subjectsByClass).flat().map((s) => [s.id, s])).values()).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="ht">Title</label><input id="ht" name="title" className="input" required maxLength={120} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="hd">Instructions</label><textarea id="hd" name="description" rows={3} className="input" required maxLength={2000} /></div>
      <div><label className="label" htmlFor="hdue">Due date</label><input id="hdue" name="dueOn" type="date" className="input" required /></div>
      <div><label className="label" htmlFor="hf">Attachment (optional, max 3 MB)</label><input id="hf" name="file" type="file" accept={ACCEPT_ALL} className="input !py-2" /></div>
      <div className="flex items-end justify-end"><button className="btn" disabled={pending}>{pending ? "Posting…" : "Post homework"}</button></div>
    </form>
  );
}
