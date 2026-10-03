import Link from "next/link";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export type LegalSection = { id: string; title: string; body: (string | string[])[] };

/** Long-form legal document with a sticky table of contents. Arrays render as bullet lists. */
export function LegalDoc({ title, intro, sections, path }: { title: string; intro: string; sections: LegalSection[]; path: string }) {
  return (
    <div className="bg-white">
      <section className="blob-bg border-b border-slate-100 bg-gradient-to-br from-brand-50 via-white to-sun-50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{intro}</p>
          <p className="mt-4 text-sm text-slate-500">Effective and last updated: <b className="text-slate-700">{SITE.updated}</b></p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[17rem_1fr] lg:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:open:bg-slate-50" open>
            <summary className="cursor-pointer text-sm font-bold text-brand-950 lg:pointer-events-none">Contents</summary>
            <ol className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1 text-sm">
              {sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-brand-700"><span className="mr-1.5 text-slate-400">{i + 1}.</span>{s.title}</a></li>)}
            </ol>
          </details>
          <div className="mt-5 hidden rounded-2xl border border-slate-200 p-4 text-sm lg:block">
            <p className="font-bold text-brand-950">Related documents</p>
            <ul className="mt-2 space-y-1.5">
              {LEGAL_LINKS.filter((l) => l.href !== path).map((l) => <li key={l.href}><Link className="text-brand-600 hover:underline" href={l.href}>{l.label}</Link></li>)}
            </ul>
          </div>
        </aside>
        <article className="min-w-0 max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-slate-100 py-7 first:pt-0 last:border-0">
              <h2 className="text-xl font-extrabold text-brand-950 sm:text-2xl"><span className="mr-2 text-brand-400">{i + 1}.</span>{s.title}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">
                {s.body.map((b, j) => Array.isArray(b)
                  ? <ul key={j} className="list-disc space-y-1.5 pl-6 marker:text-brand-400">{b.map((li, k) => <li key={k}>{li}</li>)}</ul>
                  : <p key={j}>{b}</p>)}
              </div>
            </section>
          ))}
          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-slate-700">
            <p className="font-bold text-brand-950">Questions about this document?</p>
            <p className="mt-1">Write to <a className="font-semibold text-brand-700 underline" href={`mailto:${SITE.email}`}>{SITE.email}</a> or message us on <a className="font-semibold text-brand-700 underline" href={`https://wa.me/${SITE.whatsapp}`}>WhatsApp</a>. We usually reply within two business days.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
