import Link from "next/link";
import { getCtx } from "@/lib/scope";
import { WorkspaceSwitcher } from "./workspace";
import { db } from "@/lib/db";
import { navFor } from "@/components/nav";
import { logoutAction } from "@/lib/actions-auth";
import { NavLinks } from "@/components/shell/nav-links";
import { MobileMenu } from "@/components/shell/mobile-menu";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Icon } from "@/components/icons";
import { keyedHref } from "@/lib/pagekey";
import { ForcePassword } from "./force-password";

const ROLE_LABEL = { SUPER_ADMIN: "Platform admin", ADMIN: "Principal / Admin", TEACHER: "Teacher", PARENT: "Parent" } as const;

function Brand({ school }: { school: string }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white p-1.5 shadow-lg"><img src="/logo-icon.png" alt="" className="h-full w-full object-contain" /></span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">EduSphere</span>
        <span className="block truncate text-xs text-brand-300">{school}</span>
      </span>
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const user = ctx.user;
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  if (user.mustChangePassword) return <ForcePassword name={user.name} />;
  const secret = process.env.AUTH_SECRET ?? "";
  const items = await Promise.all(navFor(user.role, ctx.mode, ctx.perms).map(async (n) => ({ href: await keyedHref(user.id, n.href, secret), base: n.href, label: n.label, icon: n.icon, group: n.group, badge: n.href === "/notifications" ? unread : undefined })));
  const quick = (user.role === "SUPER_ADMIN" ? ["/dashboard", "/schools", "/settings"] : ctx.mode === "SUBJECT" ? ["/dashboard", "/exams", "/portions", "/homework"] : ["/dashboard", "/attendance", "/homework", "/messages"])
    .map((h) => items.find((i) => i.base === h)).filter((i): i is (typeof items)[number] => !!i);
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const school = user.school?.name ?? "All schools";
  const roleLabel = user.role === "TEACHER" ? (ctx.position ? `${ctx.position} · ${ctx.mode === "SUBJECT" ? "Subject teacher" : "Teacher"}` : ctx.mode === "SUBJECT" ? "Subject teacher" : ctx.mode === "CLASS" ? "Class teacher" : "Teacher") : ROLE_LABEL[user.role];
  const switcher = user.role === "TEACHER" && ctx.workspaces.length > 0 ? <WorkspaceSwitcher items={ctx.workspaces} active={ctx.active!.id} /> : null;
  const userCard = (
    <div className="mt-6 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sun-400 to-coral-500 text-sm font-bold text-white">{initials}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          <div className="truncate text-xs text-brand-300">{roleLabel}</div>
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
            <span className={`text-base font-extrabold text-brand-900 ${switcher ? "hidden min-[420px]:inline" : ""}`}>EduSphere</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">{switcher ?? school}</div>
          <div className="flex items-center gap-3">
            {switcher && <div className="lg:hidden">{switcher}</div>}
            <Link href="/notifications" className="relative rounded-xl bg-white p-2.5 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-brand-700" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
              <Icon name="bell" className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
            <div className="hidden items-center gap-3 rounded-2xl bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{initials}</span>
              <span className="text-sm font-semibold leading-tight">{user.name}<span className="block text-xs font-normal text-slate-500">{roleLabel}</span></span>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl p-4 pb-28 sm:p-8 lg:pb-8">{children}</main>
        <BottomNav items={quick.map((q) => ({ href: q.href, base: q.base, label: q.label.split(" ")[0], icon: q.icon, badge: q.badge }))} />
      </div>
    </div>
  );
}
