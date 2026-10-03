"use client";
import { useActionState, useRef } from "react";
import { postAnnouncement } from "./actions";
import { ACCEPT_ALL } from "@/lib/fileTypes";

export function AnnForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [st, action, pending] = useActionState(async (p: { error?: string; ok?: boolean } | undefined, fd: FormData) => { const r = await postAnnouncement(p, fd); if (r.ok) ref.current?.reset(); return r; }, undefined);
  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-3">
      {st?.error && <p role="alert" className="sm:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p role="status" className="sm:col-span-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Announcement posted and recipients notified.</p>}
      <div className="sm:col-span-2"><label className="label" htmlFor="at">Title</label><input id="at" name="title" className="input" required maxLength={120} /></div>
      <div><label className="label" htmlFor="aa">Audience</label><select id="aa" name="audience" className="input"><option value="ALL">Everyone</option><option value="TEACHERS">Teachers</option><option value="PARENTS">Parents</option></select></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="ab">Message</label><textarea id="ab" name="body" rows={4} className="input" required maxLength={4000} /></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="af">Attach a circular or image (optional, max 3 MB)</label><input id="af" name="file" type="file" accept={ACCEPT_ALL} className="input !py-2" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="accent-brand-600" /> Pin to top</label>
      <div className="sm:col-span-2 text-right"><button className="btn" disabled={pending}>{pending ? "Posting…" : "Post announcement"}</button></div>
    </form>
  );
}
