"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icons";
import { stripKey } from "@/lib/pagekey";

type Item = { href: string; base?: string; label: string; icon: IconName; badge?: number };

/** Thumb-reach tab bar shown on phones only. */
export function BottomNav({ items }: { items: Item[] }) {
  const path = stripKey(usePathname());
  return (
    <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(30,27,75,.2)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
        {items.map((i) => {
          const base = i.base ?? i.href;
          const active = path === base || path.startsWith(base + "/");
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? "text-brand-600" : "text-slate-500"}`}>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-brand-100" : ""}`}><Icon name={i.icon} className="h-[20px] w-[20px]" /></span>
                {i.label}
                {!!i.badge && <span className="absolute right-3 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral-500 px-1 text-[9px] font-bold text-white">{i.badge}</span>}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => window.dispatchEvent(new Event("es:menu"))} className="flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-500">
            <span className="grid h-7 w-12 place-items-center"><Icon name="menu" className="h-[20px] w-[20px]" /></span>More
          </button>
        </li>
      </ul>
    </nav>
  );
}
