"use client";
import { useEffect, useState, useTransition } from "react";
import { setLang } from "@/lib/lang-action";

const OPTS = [["en", "EN"], ["ml", "മല"], ["hi", "हि"]] as const;

export function LangSwitch({ current, dark }: { current?: string; dark?: boolean }) {
  const [ck, setCk] = useState("en");
  useEffect(() => { setCk(document.cookie.match(/(?:^|; )es_lang=(\w+)/)?.[1] ?? "en"); }, []);
  const cur = current ?? ck;
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label="Language" className={`inline-flex overflow-hidden rounded-xl text-xs font-bold ring-1 ${dark ? "ring-white/20" : "ring-slate-200 bg-white"} ${pending ? "opacity-60" : ""}`}>
      {OPTS.map(([c, l]) => (
        <button key={c} type="button" aria-pressed={cur === c} onClick={() => start(() => setLang(c))} className={`px-2.5 py-1.5 ${cur === c ? "bg-brand-600 text-white" : dark ? "text-brand-100 hover:bg-white/10" : "text-slate-600 hover:bg-slate-50"}`}>{l}</button>
      ))}
    </div>
  );
}
