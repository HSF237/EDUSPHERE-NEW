"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icons";

type Item = { href: string; label: string; icon: IconName; group: string; badge?: number };

export function NavLinks({ items, onNavigate }: { items: Item[]; onNavigate?: () => void }) {
  const path = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav aria-label="Main" className="space-y-5">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-brand-300/70">{g}</div>
          <ul className="space-y-0.5">
            {items.filter((i) => i.group === g).map((i) => {
              const active = path === i.href || path.startsWith(i.href + "/");
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-white text-brand-800 shadow-md" : "text-brand-100/80 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon name={i.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand-600" : "text-brand-300/80 group-hover:text-white"}`} />
                    <span className="flex-1">{i.label}</span>
                    {!!i.badge && <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{i.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
