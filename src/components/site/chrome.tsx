import Link from "next/link";
import { Icon } from "@/components/icons";
import { LEGAL_LINKS, SITE } from "@/lib/site";

const NAV = [
  { href: "/#roles", label: "Who it’s for" },
  { href: "/#modules", label: "Features" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label={`${SITE.name} home`} className="flex items-center">
      {light ? (
        <span className="flex items-center gap-2.5 text-lg font-extrabold text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-9 w-auto" />{SITE.name}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo.png" alt={SITE.name} className="h-9 w-auto sm:h-10" />
      )}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-brand-700">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/register-school" className="btn-ghost hidden sm:inline-flex">Create school</Link>
          <Link href="/login" className="btn">Sign in</Link>
          <details className="relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 [&::-webkit-details-marker]:hidden" aria-label="Menu"><Icon name="menu" /></summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{n.label}</Link>)}
              <Link href="/register-school" className="block rounded-xl px-4 py-3 text-sm font-bold text-brand-700 hover:bg-slate-50">Create your school</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">{SITE.tagline} Attendance, homework, exams, timetables, leave and parent communication — with every school’s data kept separate.</p>
          <p className="mt-4 text-sm text-brand-300">Operated by {SITE.operator}, {SITE.location}.</p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Product</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((n) => <li key={n.href}><Link className="text-brand-200 hover:text-white" href={n.href}>{n.label}</Link></li>)}
            <li><Link className="text-brand-200 hover:text-white" href="/register-school">Create your school</Link></li>
            <li><Link className="text-brand-200 hover:text-white" href="/login">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Legal</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LEGAL_LINKS.map((l) => <li key={l.href}><Link className="text-brand-200 hover:text-white" href={l.href}>{l.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-brand-200">
            <li><a className="hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><a className="hover:text-white" href={`https://wa.me/${SITE.whatsapp}`}>WhatsApp {SITE.phoneDisplay}</a></li>
            <li>{SITE.location}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Documents last updated {SITE.updated}.</p>
        </div>
      </div>
    </footer>
  );
}
