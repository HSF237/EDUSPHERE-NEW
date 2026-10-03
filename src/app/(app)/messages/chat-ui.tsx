"use client";
import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendChat } from "./actions";

export type ChatItem = { id: string; name: string; role: string; preview: string; at: string; mine: boolean; unread: number; subject: string };
export type Contact = { id: string; name: string; role: string; convId?: string };
export type Msg = { id: string; mine: boolean; body: string; at: string; pending?: boolean };

const ROLE: Record<string, string> = { ADMIN: "Principal", TEACHER: "Teacher", PARENT: "Parent", SUPER_ADMIN: "Platform" };
const TONES = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-fuchsia-500"];
const tone = (s: string) => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
const initials = (n: string) => n.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ name, size = "h-11 w-11" }: { name: string; size?: string }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full text-sm font-bold text-white ${tone(name)}`}>{initials(name)}</span>;
}

function when(iso: string) {
  const d = new Date(iso); const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export function ChatList({ chats, contacts, activeId, activeUser, canCompose }: { chats: ChatItem[]; contacts: Contact[]; activeId?: string; activeUser?: string; canCompose: boolean }) {
  const [tab, setTab] = useState<"chats" | "contacts">("chats");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const n = q.trim().toLowerCase();
  const fc = chats.filter((c) => !n || c.name.toLowerCase().includes(n) || c.preview.toLowerCase().includes(n));
  const roles = useMemo(() => [...new Set(contacts.map((c) => c.role))], [contacts]);
  const fp = contacts.filter((c) => (role === "ALL" || c.role === role) && (!n || c.name.toLowerCase().includes(n)));
  const unreadTotal = chats.reduce((a, c) => a + c.unread, 0);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-slate-100 p-4 pb-3">
        <div className="flex items-center justify-between"><h1 className="text-xl font-extrabold text-slate-900">Messages</h1></div>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "chats" ? "Search chats" : "Search contacts"} className="input !rounded-full !pl-9 text-base sm:text-sm" aria-label="Search" />
        </div>
        <div className="flex gap-2" role="tablist">
          {(["chats", "contacts"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t === "chats" ? "Chats" : "Contacts"}{t === "chats" && unreadTotal > 0 && <span className="ml-1.5 rounded-full bg-white/90 px-1.5 text-[11px] text-brand-700">{unreadTotal}</span>}
            </button>
          ))}
        </div>
        {tab === "contacts" && roles.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {["ALL", ...roles].map((r) => <button key={r} onClick={() => setRole(r)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${role === r ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>{r === "ALL" ? "Everyone" : (ROLE[r] ?? r) + "s"}</button>)}
          </div>
        )}
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-slate-50 overflow-y-auto overscroll-contain pb-24 lg:pb-0">
        {tab === "chats" ? (
          fc.length === 0 ? (
            <li className="p-8 text-center text-sm text-slate-500">{chats.length === 0 ? <>No chats yet.{canCompose && <> <button onClick={() => setTab("contacts")} className="font-semibold text-brand-600">Start one from Contacts</button>.</>}</> : "No chats match your search."}</li>
          ) : fc.map((c) => (
            <li key={c.id}>
              <Link href={`/messages?c=${c.id}`} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 ${activeId === c.id ? "bg-brand-50" : ""}`}>
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2"><span className={`truncate text-[15px] ${c.unread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{c.name}</span><time suppressHydrationWarning className={`shrink-0 text-xs ${c.unread ? "font-semibold text-brand-600" : "text-slate-400"}`}>{when(c.at)}</time></div>
                  <div className="flex items-center justify-between gap-2"><span className={`truncate text-sm ${c.unread ? "font-medium text-slate-700" : "text-slate-500"}`}>{c.mine && <span className="text-slate-400">You: </span>}{c.preview}</span>{c.unread > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}</div>
                </div>
              </Link>
            </li>
          ))
        ) : fp.length === 0 ? (
          <li className="p-8 text-center text-sm text-slate-500">No contacts found.</li>
        ) : fp.map((p) => (
          <li key={p.id}>
            <Link href={p.convId ? `/messages?c=${p.convId}` : `/messages?u=${p.id}`} className={`flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 ${activeUser === p.id ? "bg-brand-50" : ""}`}>
              <Avatar name={p.name} size="h-10 w-10" />
              <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-semibold text-slate-800">{p.name}</div><div className="text-xs text-slate-500">{ROLE[p.role] ?? p.role}</div></div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChatPane({ peer, convId, subject, messages, peerReadAt }: { peer: { id: string; name: string; role: string }; convId?: string; subject?: string; messages: Msg[]; peerReadAt: string | null }) {
  const router = useRouter();
  const [opt, addOpt] = useOptimistic(messages, (s, m: Msg) => [...s, m]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [opt.length, convId]);
  useEffect(() => {
    if (!convId) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 6000);
    return () => clearInterval(t);
  }, [convId, router]);
  function send() {
    const body = text.trim(); if (!body) return;
    setText(""); setErr(""); if (box.current) box.current.style.height = "auto";
    start(async () => {
      addOpt({ id: "tmp" + Date.now(), mine: true, body, at: new Date().toISOString(), pending: true });
      const r = await sendChat({ conversationId: convId, userId: convId ? undefined : peer.id, body });
      if (r.error) { setErr(r.error); setText(body); return; }
      if (!convId && r.id) router.replace(`/messages?c=${r.id}`);
    });
  }
  const rows: (Msg | { sep: string; id: string })[] = [];
  let last = "";
  for (const m of opt) { const d = new Date(m.at).toDateString(); if (d !== last) { last = d; rows.push({ sep: d, id: "s" + d }); } rows.push(m); }
  const label = (d: string) => { const x = new Date(d); const now = new Date(); const y = new Date(now); y.setDate(now.getDate() - 1); return x.toDateString() === now.toDateString() ? "Today" : x.toDateString() === y.toDateString() ? "Yesterday" : x.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" }); };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-4">
        <Link href="/messages" aria-label="Back to chats" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></Link>
        <Avatar name={peer.name} size="h-10 w-10" />
        <div className="min-w-0"><div className="truncate font-bold text-slate-900">{peer.name}</div><div className="truncate text-xs text-slate-500">{ROLE[peer.role] ?? peer.role}{subject && subject !== "Chat" ? ` · ${subject}` : ""}</div></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#eceefa] px-3 py-4 sm:px-6">
        {rows.length === 0 && <div className="mx-auto mt-10 max-w-xs rounded-2xl bg-white/80 p-5 text-center text-sm text-slate-500">Say hello to <b className="text-slate-700">{peer.name}</b>. Messages are private between you and them.</div>}
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
          {rows.map((r) => "sep" in r ? (
            <div key={r.id} className="my-2 text-center"><span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm"><span suppressHydrationWarning>{label(r.sep)}</span></span></div>
          ) : (
            <div key={r.id} className={`flex ${r.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] shadow-sm sm:max-w-[70%] ${r.mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-slate-800"} ${r.pending ? "opacity-70" : ""}`}>
                <p className="whitespace-pre-wrap break-words">{r.body}</p>
                <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${r.mine ? "text-indigo-200" : "text-slate-400"}`}>
                  <time suppressHydrationWarning>{new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  {r.mine && <span className={peerReadAt && r.at <= peerReadAt ? "text-sky-300" : ""} aria-label={peerReadAt && r.at <= peerReadAt ? "Read" : "Sent"}>{r.pending ? "…" : peerReadAt && r.at <= peerReadAt ? "✓✓" : "✓"}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={end} />
      </div>
      {err && <p className="bg-red-50 px-4 py-1.5 text-xs text-red-700">{err}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-slate-100 bg-white p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3">
        <textarea ref={box} rows={1} value={text} maxLength={4000} aria-label="Message" placeholder="Type a message"
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 1024px)").matches) { e.preventDefault(); send(); } }}
          className="input max-h-[120px] min-h-[44px] flex-1 resize-none !rounded-3xl py-2.5 text-base sm:text-sm" />
        <button type="submit" disabled={!text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow transition hover:bg-brand-700 disabled:opacity-40"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.5L15 12 3.39 13.9z" /></svg></button>
      </form>
    </div>
  );
}
