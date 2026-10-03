import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { NAV } from "@/components/nav";
import { logoutAction } from "@/lib/actions-auth";
import { NavLinks } from "@/components/shell/nav-links";
import { MobileMenu } from "@/components/shell/mobile-menu";
import { Icon } from "@/components/icons";

const ROLE_LABEL = { SUPER_ADMIN: "Platform admin", ADMIN: "Principal / Admin", TEACHER: "Teacher", PARENT: "Parent" } as const;

function Brand({ school }: { school: string }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sun-400 to-coral-500 text-white shadow-lg shadow-coral-500/30"><Icon name="cap" className="h-5 w-5" /></span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">EduSphere</span>
        <span className="block truncate text-xs text-brand-300">{school}</span>
      </span>
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  const items = NAV.filter((n) => n.roles.includes(user.role)).map((n) => ({ href: n.href, label: n.label, icon: n.icon, group: n.group, badge: n.href === "/notifications" ? unread : undefined }));
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const school = user.school?.name ?? "All schools";
  const userCard = (
    <div className="mt-6 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sun-400 to-coral-500 text-sm font-bold text-white">{initials}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          <div className="truncate text-xs text-brand-300">{ROLE_LABEL[user.role]}</div>
        </div>
      </div>
      <form action={logoutAction} className="mt-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-brand-100 transition hover:bg-white/20 hover:text-white"><Icon name="logout" className="h-4 w-4" />Sign out</button>
      </form>
    </div>
  );
  return (
    <div className="min-h-screen lg:flex">
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="pointer-events-none absolute -left-20 top-40 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mb-7 mt-1"><Brand school={school} /></div>
        <div className="relative flex-1"><NavLinks items={items} /></div>
        <div className="relative">{userCard}</div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-[#f5f6fc]/85 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileMenu>
              <div className="mb-6"><Brand school={school} /></div>
              <NavLinks items={items} />
              {userCard}
            </MobileMenu>
            <span className="text-base font-extrabold text-brand-900">EduSphere</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">{school}</div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative rounded-xl bg-white p-2.5 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-brand-700" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
              <Icon name="bell" className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
            <div className="hidden items-center gap-3 rounded-2xl bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{initials}</span>
              <span className="text-sm font-semibold leading-tight">{user.name}<span className="block text-xs font-normal text-slate-500">{ROLE_LABEL[user.role]}</span></span>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
