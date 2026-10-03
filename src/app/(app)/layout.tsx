import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { NAV } from "@/components/nav";
import { logoutAction } from "@/lib/actions-auth";

const ROLE_LABEL = { SUPER_ADMIN: "Platform admin", ADMIN: "Principal / Admin", TEACHER: "Teacher", PARENT: "Parent" } as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  const items = NAV.filter((n) => n.roles.includes(user.role));
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-lg font-bold text-brand-700">EduSphere</div>
            <div className="text-xs text-slate-500">{user.school?.name ?? "All schools"}</div>
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {n.label}
              {n.href === "/notifications" && unread > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-right text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
          </div>
          <form action={logoutAction}><button className="btn-ghost">Sign out</button></form>
        </header>
        <main id="main" className="mx-auto max-w-6xl p-6">{children}</main>
      </div>
    </div>
  );
}
