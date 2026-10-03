"use client";
import { useState, useTransition } from "react";

type One = { error?: string; path?: string };
type Many = { error?: string; items?: { label: string; path: string }[] };

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700" onClick={async () => {
      try { await navigator.clipboard.writeText(text); } catch { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
      setDone(true); setTimeout(() => setDone(false), 1800);
    }}>{done ? "Copied ✓" : label}</button>
  );
}

/** Button that asks the server for a secret link, then shows it with Copy / WhatsApp. */
export function LinkMaker({ action, label, message, compact }: { action: () => Promise<One>; label: string; message?: string; compact?: boolean }) {
  const [res, setRes] = useState<One | null>(null);
  const [pending, start] = useTransition();
  const url = res?.path ? `${typeof window !== "undefined" ? window.location.origin : ""}${res.path}` : "";
  return (
    <div className={compact ? "inline-block text-left" : ""}>
      <button type="button" disabled={pending} onClick={() => start(async () => setRes(await action()))} className={compact ? "text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50" : "btn"}>{pending ? "Creating…" : label}</button>
      {res?.error && <p role="alert" className="mt-2 text-xs text-red-600">{res.error}</p>}
      {url && (
        <div className="mt-2 w-full min-w-[16rem] max-w-md rounded-xl border border-brand-100 bg-brand-50 p-3">
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700" aria-label="Secret link" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Copy text={url} />
            <a className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent((message ? message + " " : "") + url)}`}>Share on WhatsApp</a>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Anyone with this link can use it, so send it only to the right person.</p>
        </div>
      )}
    </div>
  );
}

/** Generates many links at once and lets the teacher copy the whole list. */
export function BulkLinks({ action, label }: { action: () => Promise<Many>; label: string }) {
  const [res, setRes] = useState<Many | null>(null);
  const [pending, start] = useTransition();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const text = (res?.items ?? []).map((i) => `${i.label}: ${origin}${i.path}`).join("\n");
  return (
    <div>
      <button type="button" disabled={pending} onClick={() => start(async () => setRes(await action()))} className="btn-ghost">{pending ? "Creating…" : label}</button>
      {res?.error && <p role="alert" className="mt-2 text-xs text-red-600">{res.error}</p>}
      {res?.items && (
        <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-brand-900">{res.items.length} parent links ready</p><Copy text={text} label="Copy all" /></div>
          <textarea readOnly value={text} rows={Math.min(10, res.items.length + 1)} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-700" aria-label="Parent links" />
          <p className="mt-1 text-[11px] text-slate-500">Each link is for one child. Send it only to that child’s parent or guardian.</p>
        </div>
      )}
    </div>
  );
}
