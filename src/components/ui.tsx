import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Card({ title, action, children, className, flush }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("card", className)}>
      {title && <div className="card-h"><h2>{title}</h2>{action}</div>}
      <div className={flush ? "" : "card-b"}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = "slate" }: { label: string; value: React.ReactNode; hint?: string; tone?: "slate" | "green" | "red" | "amber" | "indigo" }) {
  const t = { slate: "text-slate-900", green: "text-emerald-600", red: "text-red-600", amber: "text-amber-600", indigo: "text-brand-600" }[tone];
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-2 text-3xl font-bold", t)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700", slate: "bg-slate-100 text-slate-600", indigo: "bg-indigo-50 text-indigo-700",
};
export function Badge({ tone = "slate", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn("badge", tones[tone])}>{children}</span>;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Progress({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "green" | "red" | "amber" }) {
  const c = { indigo: "bg-brand-600", green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", c)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-100 bg-slate-50"><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
