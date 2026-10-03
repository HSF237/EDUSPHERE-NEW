// Dependency-free SVG/CSS charts. Server-component safe (no state, no effects).
import { cn } from "@/lib/utils";

const PAL = { ind: "#4f46e5", ind2: "#818cf8", teal: "#14b8a6", coral: "#ff6b57", sun: "#ffc83d", green: "#10b981", red: "#ef4444", amber: "#f59e0b", slate: "#94a3b8" };
export const tint = (v: number, good = 90, ok = 80) => (v >= good ? PAL.green : v >= ok ? PAL.amber : PAL.red);

/** Area/line chart with a faint grid. `ma` draws a moving-average overlay. */
export function LineChart({ points, id, min = 0, max = 100, unit = "%", ma = 0, color = PAL.ind, height = 190 }: {
  points: { label: string; value: number }[]; id: string; min?: number; max?: number; unit?: string; ma?: number; color?: string; height?: number;
}) {
  if (points.length < 2) return <p className="py-8 text-center text-sm text-slate-500">Not enough data yet.</p>;
  const W = 640, H = height, L = 36, R = 10, T = 12, B = 26;
  const x = (i: number) => L + (i / (points.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min)) * (H - T - B);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)} ${H - B}L${L} ${H - B}Z`;
  const avg = ma > 1 ? points.map((_, i) => { const s = points.slice(Math.max(0, i - ma + 1), i + 1); return s.reduce((a, p) => a + p.value, 0) / s.length; }) : [];
  const maLine = avg.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const ticks = [0, 1, 2, 3].map((t) => min + ((max - min) * t) / 3);
  const step = Math.max(1, Math.ceil(points.length / 7));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Trend chart">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t) => (<g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e8eaf5" strokeDasharray="3 4" /><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{Math.round(t)}{unit}</text></g>))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={ma > 1 ? 1.5 : 2.5} strokeOpacity={ma > 1 ? 0.45 : 1} strokeLinejoin="round" strokeLinecap="round" />
      {ma > 1 && <path d={maLine} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (i % step === 0 || i === points.length - 1) && <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize="11" fill="#94a3b8">{p.label}</text>)}
      {points.length <= 40 && points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={2.6} fill="#fff" stroke={color} strokeWidth={1.8}><title>{`${p.label}: ${p.value.toFixed(1)}${unit}`}</title></circle>)}
    </svg>
  );
}

/** Horizontal bars — good for rankings with labels. */
export function HBars({ items, max = 100, unit = "%" }: { items: { label: string; value: number; color?: string; sub?: string }[]; max?: number; unit?: string }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{it.label}{it.sub && <span className="ml-2 text-xs font-normal text-slate-400">{it.sub}</span>}</span><span className="shrink-0 font-semibold tabular-nums text-slate-900">{Math.round(it.value * 10) / 10}{unit}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, (it.value / max) * 100))}%`, background: it.color ?? PAL.ind }} /></div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns, optionally grouped (several series per label). */
export function Columns({ groups, series, max = 100, unit = "%", height = 170 }: {
  groups: { label: string; values: number[] }[]; series: { name: string; color: string }[]; max?: number; unit?: string; height?: number;
}) {
  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {groups.map((g) => (
          <div key={g.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-0.5">
              {g.values.map((v, i) => (
                <div key={i} className="group relative flex-1 rounded-t-md transition-all duration-700" style={{ height: `${Math.max(1.5, Math.min(100, (v / max) * 100))}%`, background: series[i]?.color, maxWidth: 28 }} title={`${series[i]?.name ?? ""} ${g.label}: ${Math.round(v * 10) / 10}${unit}`}>
                  {groups.length <= 8 && series.length === 1 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-slate-600">{Math.round(v)}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">{groups.map((g) => <div key={g.label} className="min-w-0 flex-1 truncate text-center text-[11px] text-slate-500">{g.label}</div>)}</div>
      {series.length > 1 && <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-600">{series.map((s) => <span key={s.name} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}</div>}
    </div>
  );
}

export function Donut({ segments, center, sub, size = 168 }: { segments: { label: string; value: number; color: string }[]; center: string; sub?: string; size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Breakdown chart">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef0f8" strokeWidth="16" />
        {segments.map((s) => { const len = (s.value / total) * c; const el = <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />; off += len; return el; })}
        <text x="70" y="69" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e1b4b">{center}</text>
        {sub && <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#94a3b8">{sub}</text>}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => <li key={s.label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /><span className="text-slate-600">{s.label}</span><b className="ml-auto pl-4 tabular-nums">{s.value.toLocaleString()}</b><span className="w-10 text-right text-xs text-slate-400">{Math.round((s.value / total) * 100)}%</span></li>)}
      </ul>
    </div>
  );
}

/** Rows × columns heat grid (e.g. class × week attendance). */
export function Heatmap({ rows, cols, cell, className }: { rows: string[]; cols: string[]; cell: (r: number, c: number) => number | null; className?: string }) {
  const color = (v: number | null) => (v == null ? "#f1f3fa" : v >= 95 ? "#10b981" : v >= 92 ? "#34d399" : v >= 88 ? "#a7f3d0" : v >= 84 ? "#fde68a" : v >= 78 ? "#fdba74" : "#f87171");
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-1 text-center text-[11px]">
        <thead><tr><th className="w-10" />{cols.map((c) => <th key={c} className="font-medium text-slate-400">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r}><th className="pr-1 text-right font-semibold text-slate-600">{r}</th>
            {cols.map((c, j) => { const v = cell(i, j); return <td key={c} className="h-7 min-w-[34px] rounded-md font-semibold text-slate-800/80" style={{ background: color(v) }} title={v == null ? "No data" : `${r} · ${c}: ${v.toFixed(1)}%`}>{v == null ? "" : Math.round(v)}</td>; })}</tr>))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">lower<i className="h-2.5 w-5 rounded-sm" style={{ background: "#f87171" }} /><i className="h-2.5 w-5 rounded-sm" style={{ background: "#fdba74" }} /><i className="h-2.5 w-5 rounded-sm" style={{ background: "#fde68a" }} /><i className="h-2.5 w-5 rounded-sm" style={{ background: "#a7f3d0" }} /><i className="h-2.5 w-5 rounded-sm" style={{ background: "#10b981" }} />higher</div>
    </div>
  );
}
