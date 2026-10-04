"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

type Item = { id: string; title: string; body: string | null; link: string | null; toast: boolean };

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch { /* sound is optional */ }
}

/** The header bell: updates its count by itself and pops up new notifications as they arrive. */
export function LiveBell({ initialUnread, since }: { initialUnread: number; since: string }) {
  const [unread, setUnread] = useState(initialUnread);
  const [toasts, setToasts] = useState<Item[]>([]);
  const cursor = useRef(since);
  const seen = useRef(new Set<string>());
  const busy = useRef(false);
  const path = usePathname();
  const router = useRouter();

  const poll = useCallback(async () => {
    if (busy.current || document.visibilityState !== "visible") return;
    busy.current = true;
    try {
      const r = await fetch(`/api/notifications/live?since=${encodeURIComponent(cursor.current)}`, { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { unread: number; now: string; sound: boolean; items: Item[] };
      cursor.current = d.now; setUnread(d.unread);
      const fresh = d.items.filter((i) => !seen.current.has(i.id));
      fresh.forEach((i) => seen.current.add(i.id));
      if (fresh.length) router.refresh(); // keeps the sidebar count in step
      // On the Messages screen the open chat already refreshes itself, so don't pop up over it.
      const show = fresh.filter((i) => i.toast && !(path === "/messages" && (i.link ?? "").startsWith("/messages")));
      if (show.length) {
        setToasts((t) => [...t, ...show].slice(-3));
        if (d.sound) beep();
        show.forEach((i) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== i.id)), 7000));
      }
    } catch { /* offline: try again next tick */ } finally { busy.current = false; }
  }, [path, router]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 10000);
    const vis = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [poll]);

  return (
    <>
      <Link href="/notifications" className="relative rounded-xl bg-white p-2.5 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-brand-700" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </Link>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-20 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setToasts((x) => x.filter((i) => i.id !== t.id)); router.push(t.link || "/notifications"); }}>
              <span className="block truncate text-sm font-bold text-slate-900">{t.title}</span>
              {t.body && <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600">{t.body}</span>}
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((i) => i.id !== t.id))} className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">&times;</button>
          </div>
        ))}
      </div>
    </>
  );
}
