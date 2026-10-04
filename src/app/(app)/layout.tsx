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
import { LangSwitch } from "@/components/lang-switch";
import { getLang, tr } from "@/lib/i18n";
import { brandVars } from "@/lib/branding";
import { exitSupport } from "./owner/actions";
import { ownerEmails } from "@/lib/owner";
import { GRACE_DAYS } from "@/lib/plans";
import { fmtDate } from "@/lib/utils";
import { Tour, type CheckItem } from "@/components/tour";

const ROLE_LABEL = { SUPER_ADMIN: "Platform admin", ADMIN: "Principal / Admin", TEACHER: "Teacher", PARENT: "Parent" } as const;

function Brand({ school, logo }: { school: string; logo?: string | null }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white p-1.5 shadow-lg"><img src={logo ?? "/logo-icon.png"} alt="" className="h-full w-full object-contain" /></span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">{logo ? school : "EduSphere"}</span>
        <span className="block truncate text-xs text-brand-300">{logo ? "EduSphere" : school}</span>
      </span>
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const user = ctx.user;
  const lang = await getLang();
  const sch = user.schoolId ? await db.school.findUnique({ where: { id: user.schoolId }, select: { brandColor: true, logoFileId: true } }) : null;
  const vars = brandVars(sch?.brandColor);
  const logo = sch?.logoFileId ? `/api/files/${sch.logoFileId}` : null;
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  // Opening the app anywhere counts as "delivered" for messages sent to this user (the grey double tick).
  await db.$executeRaw`UPDATE "ConversationMember" cm SET "lastDeliveredAt" = now() WHERE cm."userId" = ${user.id} AND EXISTS (SELECT 1 FROM "Message" m WHERE m."conversationId" = cm."conversationId" AND m."createdAt" > cm."lastDeliveredAt")`;
  if (user.mustChangePassword) return <ForcePassword name={user.name} />;
  const secret = process.env.AUTH_SECRET ?? "";
  const items = await Promise.all(navFor(user.role, ctx.mode, ctx.perms).filter((n) => n.href !== "/owner" || ownerEmails().includes(user.email.toLowerCase())).map(async (n) => ({ href: await keyedHref(user.id, n.href, secret), base: n.href, label: tr(lang, n.label), icon: n.icon, group: n.group ? tr(lang, n.group) : n.group, badge: n.href === "/notifications" ? unread : undefined })));
  const quick = (user.role === "SUPER_ADMIN" ? ["/dashboard", "/schools", "/settings"] : ctx.mode === "SUBJECT" ? ["/dashboard", "/exams", "/portions", "/homework"] : ["/dashboard", "/attendance", "/homework", "/messages"])
    .map((h) => items.find((i) => i.base === h)).filter((i): i is (typeof items)[number] => !!i);
  let checklist: CheckItem[] | null = null;
  if (user.role === "ADMIN" && user.schoolId) {
    const sid = user.schoolId;
    const [nc, ns, nt, nst, np, ni] = await Promise.all([
      db.class.count({ where: { schoolId: sid } }), db.subject.count({ where: { schoolId: sid } }), db.teacher.count({ where: { schoolId: sid } }),
      db.student.count({ where: { schoolId: sid } }), db.user.count({ where: { schoolId: sid, role: "PARENT" } }),
      db.invite.count({ where: { schoolId: sid, kind: "TEACHER" } }),
    ]);
    const paid = ctx.access?.state === "COMPED" || ctx.access?.state === "ACTIVE" || ctx.access?.state === "GRACE";
    checklist = [
      ...(paid ? [] : [{ key: "plan", label: "Activate your school", hint: "Choose a plan. Until then the school is read-only.", href: "/billing", done: false, locked: false }]),
      { key: "classes", label: "Create your classes", hint: "Every class and section, e.g. Grade 5 / A.", href: "/classes", done: nc > 0, locked: !paid },
      { key: "subjects", label: "Add your subjects", hint: "Teachers pick from these when they sign up.", href: "/classes", done: ns > 0, locked: !paid },
      { key: "teachers", label: "Invite your teachers", hint: nc > 0 && ns > 0 ? "Send each teacher a secret link." : "Unlocks after classes and subjects.", href: "/teachers", done: nt > 0 || ni > 0, locked: !paid || nc === 0 || ns === 0 },
      { key: "students", label: "Add your students", hint: "With class, roll and admission number.", href: "/students", done: nst > 0, locked: !paid || nc === 0 },
      { key: "parents", label: "Invite parents", hint: "A secret link per child.", href: "/students", done: np > 0, locked: !paid || nst === 0 },
    ];
  }
  const tourRole = user.role === "ADMIN" || user.role === "TEACHER" || user.role === "PARENT" ? user.role : null;
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
      {vars && <style dangerouslySetInnerHTML={{ __html: `:root{${vars}}` }} />}
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="pointer-events-none absolute -left-20 top-40 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,.28),transparent_70%)]" />
        <div className="relative mb-7 mt-1"><Brand school={school} logo={logo} /></div>
        <div className="relative flex-1"><NavLinks items={items} /></div>
        <div className="relative">{userCard}</div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-[#f5f6fc] px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileMenu>
              <div className="mb-6"><Brand school={school} logo={logo} /></div>
              <NavLinks items={items} />
              {userCard}
            </MobileMenu>
            <span className={`text-base font-extrabold text-brand-900 ${switcher ? "hidden min-[420px]:inline" : ""}`}>EduSphere</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">{switcher ?? school}</div>
          <div className="flex items-center gap-3">
            <LangSwitch current={lang} />
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
        {ctx.support && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2 text-sm text-white sm:px-8">
            <span><b>Support mode</b> · viewing {school} as the principal. View-only: changes are disabled. Logged.</span>
            <form action={exitSupport}><button className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100">Exit support</button></form>
          </div>
        )}
        {!ctx.support && ctx.access?.state === "GRACE" && (
          <div role="status" className="bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-8">Your plan has ended. Full access continues until {ctx.access.graceEnds ? fmtDate(ctx.access.graceEnds) : `${GRACE_DAYS} days`}. {user.role === "ADMIN" ? <Link href="/billing" className="font-semibold underline">Renew now</Link> : "Please ask your principal to renew."}</div>
        )}
        {!ctx.support && (ctx.access?.state === "LOCKED" || ctx.access?.state === "SETUP") && (
          <div role="status" className="bg-red-50 px-4 py-2 text-sm text-red-900 sm:px-8">{ctx.access.state === "SETUP" ? "This school isn’t activated yet." : "This school’s plan has ended."} The account is read-only. Your data is safe and nothing is deleted. {user.role === "ADMIN" ? <Link href="/billing" className="font-semibold underline">{ctx.access.state === "SETUP" ? "Choose a plan" : "Renew to continue"}</Link> : "Please ask your principal to renew."}</div>
        )}
        <main id="main" className="mx-auto max-w-6xl p-4 pb-28 sm:p-8 lg:pb-8">{children}</main>
        {tourRole && !ctx.support && <Tour userId={user.id} role={tourRole} name={user.name} available={items.map((i) => i.base)} needsPlan={ctx.access?.state === "SETUP" || ctx.access?.state === "LOCKED"} checklist={checklist} />}
        <BottomNav items={quick.map((q) => ({ href: q.href, base: q.base, label: q.label.split(" ")[0], icon: q.icon, badge: q.badge }))} />
      </div>
    </div>
  );
}
