"use client";
import { useTransition } from "react";
import { setWorkspace } from "./workspace-action";

type W = { id: string; name: string; mode: "CLASS" | "SUBJECT"; subjects: string[] };

/** Lets a teacher pick which class they are working in; class-teacher classes unlock the full class toolset. */
export function WorkspaceSwitcher({ items, active }: { items: W[]; active: string }) {
  const [pending, start] = useTransition();
  if (items.length === 0) return null;
  const cur = items.find((w) => w.id === active) ?? items[0];
  return (
    <label className="flex items-center gap-2 rounded-2xl bg-white py-1.5 pl-3 pr-2 text-sm shadow-sm ring-1 ring-slate-200">
      <span className={`h-2 w-2 shrink-0 rounded-full ${cur.mode === "CLASS" ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
      <span className="sr-only">Working in class</span>
      <select
        value={cur.id}
        disabled={pending}
        onChange={(e) => start(() => setWorkspace(e.target.value))}
        className="max-w-[10.5rem] bg-transparent py-1 text-sm font-semibold text-brand-900 outline-none sm:max-w-[16rem]"
        aria-label="Switch class"
      >
        {items.some((w) => w.mode === "CLASS") && (
          <optgroup label="Class teacher">{items.filter((w) => w.mode === "CLASS").map((w) => <option key={w.id} value={w.id}>Class {w.name} · class teacher</option>)}</optgroup>
        )}
        {items.some((w) => w.mode === "SUBJECT") && (
          <optgroup label="Subject teacher">{items.filter((w) => w.mode === "SUBJECT").map((w) => <option key={w.id} value={w.id}>Class {w.name} · {w.subjects.join(", ") || "subject"}</option>)}</optgroup>
        )}
      </select>
    </label>
  );
}
