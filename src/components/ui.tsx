import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icons";
import { Spot, spotForTitle, type SpotName } from "./art";

export function PageHeader({ title, sub, children, art }: { title: string; sub?: string; children?: React.ReactNode; art?: SpotName | false }) {
  const spot = art === false ? undefined : art ?? spotForTitle(title);
  return (
    <div className="blob-bg animate-fade-up relative mb-7 overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-brand-50 p-5 shadow-soft sm:p-7">
      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-brand-950 sm:text-[28px]">{title}</h1>
          {sub && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">{sub}</p>}
          {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
        </div>
        {spot && <Spot name={spot} className="animate-float h-16 w-auto shrink-0 sm:h-28 lg:h-36" />}
      </div>
    </div>
  );
}

/** Illustrated welcome banner used on the dashboards. */
export function DashBanner({ title, sub, scene, chips }: { title: string; sub?: string; scene: React.ReactNode; chips?: React.ReactNode }) {
  return (
    <div className="animate-fade-up relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-5 text-white shadow-lift sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-sun-500/20" />
      <div className="relative z-10 flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-6">
        <div className="min-w-0 flex-1 self-stretch">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {sub && <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-100">{sub}</p>}
          {chips && <div className="mt-5 flex flex-wrap gap-2">{chips}</div>}
        </div>
        <div className="-mb-2 w-52 shrink-0 sm:mb-0 sm:w-64 lg:w-80 [&_svg]:animate-float [&_svg]:drop-shadow-[0_18px_30px_rgba(30,27,75,.35)]">{scene}</div>
      </div>
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">{children}</span>;
}

export function Card({ title, action, children, className, flush }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("card animate-fade-up", className)}>
      {title && <div className="card-h"><h2>{title}</h2>{action}</div>}
      <div className={flush ? "" : "card-b"}>{children}</div>
    </section>
  );
}

const statTone = {
  slate: ["text-slate-900", "bg-slate-100 text-slate-600", "chart"],
  green: ["text-emerald-600", "bg-emerald-100 text-emerald-600", "check"],
  red: ["text-red-600", "bg-red-100 text-red-600", "bell"],
  amber: ["text-amber-600", "bg-amber-100 text-amber-600", "clock"],
  indigo: ["text-brand-600", "bg-brand-100 text-brand-600", "bolt"],
} as const;

export function Stat({ label, value, hint, tone = "slate", icon }: { label: string; value: React.ReactNode; hint?: string; tone?: keyof typeof statTone; icon?: IconName }) {
  const [txt, chip, def] = statTone[tone];
  return (
    <div className="card animate-fade-up flex items-start justify-between gap-2 p-4 transition hover:-translate-y-0.5 sm:gap-3 sm:p-5 hover:shadow-lift">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs">{label}</div>
        <div className={cn("mt-1.5 text-2xl font-extrabold sm:mt-2 sm:text-3xl tracking-tight", txt)}>{value}</div>
        {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
      </div>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl", chip)}><Icon name={icon ?? def} className="h-[18px] w-[18px] sm:h-5 sm:w-5" /></span>
    </div>
  );
}

const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", red: "bg-red-50 text-red-700 ring-1 ring-red-100", amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-100", slate: "bg-slate-100 text-slate-600", indigo: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
};
export function Badge({ tone = "slate", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn("badge", tones[tone])}>{children}</span>;
}

const emptyMap: [RegExp, SpotName][] = [
  [/homework/i, "homework"], [/student|child/i, "students"], [/exam|mark|result/i, "exams"], [/announce|notice/i, "announcements"], [/message|conversation/i, "messages"],
  [/notification/i, "notifications"], [/leave/i, "leave"], [/diary/i, "diary"], [/class/i, "classes"], [/teacher/i, "teachers"], [/meeting|booking/i, "ptm"],
  [/substitut/i, "substitutes"], [/attendance|absen|register/i, "attendance"], [/timetable|period/i, "timetable"],
];
export function Empty({ title, hint, art }: { title: string; hint?: string; art?: SpotName }) {
  const spot = art ?? emptyMap.find(([r]) => r.test(title))?.[1] ?? "empty";
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <Spot name={spot} className="h-36 w-auto" />
      <p className="mt-3 text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Progress({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "green" | "red" | "amber" }) {
  const c = { indigo: "from-brand-500 to-brand-600", green: "from-emerald-400 to-emerald-500", red: "from-red-400 to-red-500", amber: "from-amber-400 to-amber-500" }[tone];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", c)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-100 bg-slate-50/70"><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100 [&>tr]:transition-colors [&>tr:hover]:bg-brand-50/40">{children}</tbody>
      </table>
    </div>
  );
}
