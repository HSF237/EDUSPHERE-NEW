"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { stripKey } from "@/lib/pagekey";
import { stepsFor } from "@/lib/tour-steps";

export type CheckItem = { key: string; label: string; hint: string; href: string; done: boolean; locked: boolean };
type Box = { x: number; y: number; w: number; h: number };

const vis = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

export function Tour({ userId, role, name, available, needsPlan, checklist }: { userId: string; role: "ADMIN" | "TEACHER" | "PARENT"; name: string; available: string[]; needsPlan: boolean; checklist: CheckItem[] | null }) {
  const router = useRouter();
  const path = stripKey(usePathname());
  const key = `es_tour_v1_${userId}`;
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [idx, setIdx] = useState(0);
  const [desktop, setDesktop] = useState(true);
  const [box, setBox] = useState<Box | null>(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const scrolled = useRef(-1);

  const all = useMemo(() => stepsFor(role, available, { name, needsPlan }), [role, available, name, needsPlan]);
  const steps = useMemo(() => all.filter((s) => s.kind !== "click" || desktop), [all, desktop]);
  const step = steps[idx];

  const finish = useCallback(() => { try { localStorage.setItem(key, "done"); } catch { /* ignore */ } setOpen(false); }, [key]);
  const start = useCallback(() => { setDesktop(window.innerWidth >= 1024); setIdx(0); setPanel(false); setOpen(true); }, []);

  useEffect(() => {
    try { if (!localStorage.getItem(key)) { const t = setTimeout(start, 900); return () => clearTimeout(t); } } catch { /* ignore */ }
  }, [key, start]);

  const find = useCallback((): HTMLElement | null => {
    if (!step || step.kind === "center") return null;
    if (step.kind === "click") return [...document.querySelectorAll<HTMLElement>(`[data-tour="nav-${step.nav}"]`)].find(vis) ?? null;
    if (step.card) {
      const h = [...document.querySelectorAll<HTMLElement>("#main section.card > .card-h h2")].find((e) => e.textContent?.trim() === step.card);
      const sec = h?.closest("section");
      if (sec && vis(sec)) return sec as HTMLElement;
    }
    const f = document.querySelector<HTMLElement>("#main > *");
    return f && vis(f) ? f : null;
  }, [step]);

  // Go to the page a step is about.
  useEffect(() => {
    if (!open || !step || step.kind !== "page" || !step.nav) return;
    if (path !== step.nav && !path.startsWith(step.nav + "/")) router.push(step.nav);
  }, [open, step, path, router]);

  // Advance a "click" step when the user opens the page themselves.
  useEffect(() => {
    if (open && step?.kind === "click" && step.nav && (path === step.nav || path.startsWith(step.nav + "/"))) setIdx((i) => i + 1);
  }, [open, step, path]);

  // Track the highlighted element.
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      const el = find();
      if (!el) { setBox(null); return; }
      if (scrolled.current !== idx) {
        scrolled.current = idx;
        if (step?.kind === "page") { el.style.scrollMarginTop = "90px"; el.scrollIntoView({ block: window.innerWidth < 640 ? "start" : "center", behavior: "smooth" }); }
        else el.scrollIntoView({ block: "nearest" });
      }
      const r = el.getBoundingClientRect();
      setBox({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [open, idx, find, step]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  function next() {
    if (!step) return;
    if (step.kind === "click" && step.nav) router.push(step.nav);
    if (idx >= steps.length - 1) { finish(); return; }
    setIdx((i) => i + 1);
  }

  const done = checklist?.filter((c) => c.done).length ?? 0;

  if (!open) {
    return (
      <>
        <button type="button" onClick={() => setPanel((p) => !p)} aria-label="Open the guide" aria-expanded={panel} className="no-print fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-700 lg:bottom-6">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">?</span>Guide{checklist && done < checklist.length && <span className="rounded-full bg-white/25 px-1.5 text-[11px]">{done}/{checklist.length}</span>}
        </button>
        {panel && (
          <div role="dialog" aria-label="Guide" className="fixed bottom-40 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:bottom-20">
            <div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-slate-900">Guide</h2><button onClick={() => setPanel(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close">✕</button></div>
            <button onClick={start} className="btn mt-3 w-full">Take the full tour</button>
            {checklist && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Setup checklist · {done}/{checklist.length}</div>
                <ul className="space-y-2">
                  {checklist.map((c) => (
                    <li key={c.key} className="flex gap-2 text-sm">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${c.done ? "bg-emerald-100 text-emerald-700" : c.locked ? "bg-slate-100 text-slate-400" : "bg-brand-100 text-brand-700"}`}>{c.done ? "✓" : c.locked ? "🔒" : "•"}</span>
                      <span className="min-w-0 flex-1"><a href={c.href} className={`font-semibold ${c.locked ? "text-slate-400" : "text-slate-800 hover:text-brand-700"}`}>{c.label}</a><span className="block text-xs text-slate-500">{c.hint}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </>
    );
  }
  if (!step) return null;

  const W = Math.min(360, vp.w - 24);
  const small = vp.w < 640;
  let pos: React.CSSProperties;
  if (!box || step.kind === "center") pos = small ? { left: 12, right: 12, bottom: 12 } : { left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: W };
  else if (small) pos = { left: 12, right: 12, bottom: 12 };
  else if (vp.w - (box.x + box.w) > W + 28) pos = { left: box.x + box.w + 16, top: Math.max(12, Math.min(box.y, vp.h - 280)), width: W };
  else if (vp.h - (box.y + box.h) > 260) pos = { left: Math.max(12, Math.min(box.x, vp.w - W - 12)), top: box.y + box.h + 14, width: W };
  else pos = { left: Math.max(12, Math.min(box.x, vp.w - W - 12)), bottom: vp.h - box.y + 14, width: W };

  const last = idx >= steps.length - 1;
  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: "none" }}>
      {box && step.kind !== "center"
        ? <div style={{ position: "fixed", left: box.x - 6, top: box.y - 6, width: box.w + 12, height: box.h + 12, borderRadius: 16, boxShadow: "0 0 0 9999px rgba(15,23,42,.62), 0 0 0 3px #818cf8", transition: "all .2s", pointerEvents: "none" }} />
        : <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.62)", pointerEvents: "auto" }} />}
      <div role="dialog" aria-label={step.title} style={{ position: "fixed", pointerEvents: "auto", ...pos }} className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-brand-600"><span>{step.chapter}</span><span className="text-slate-400">{idx + 1} / {steps.length}</span></div>
        <h2 className="text-lg font-extrabold leading-snug text-slate-900">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Skip tour</button>
          <div className="flex gap-2">
            {idx > 0 && <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Back</button>}
            <button type="button" onClick={next} className="btn">{last ? "Finish" : step.kind === "click" ? "Take me there" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
