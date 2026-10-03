// Shared palette + drawing helpers for the flat editorial illustrations.
import type { ReactNode } from "react";

export const C = {
  ink: "#1e1b4b", ind: "#4f46e5", ind2: "#818cf8", ind3: "#e0e7ff", ind4: "#c7d2fe", deep: "#312e81",
  coral: "#ff6b57", peach: "#ffd9cf", sun: "#ffc83d", sunL: "#fff1bd", teal: "#14b8a6", tealD: "#0f766e", mint: "#c9f4ec",
  cream: "#fff7ec", white: "#ffffff", grey: "#e5e7f0", wood: "#e9a96b", woodD: "#c98545", leaf: "#22a06b", leafL: "#86e0b4",
};
const SKIN = { s1: "#f6cba7", s2: "#cf9367", s3: "#8f5e3f" } as const;
const HAIR = { h1: "#2a2140", h2: "#7a4a2b", h3: "#111827", h4: "#c2410c" } as const;
export type Skin = keyof typeof SKIN;
export type Hair = keyof typeof HAIR;

type Arm = [number, number, number, number]; // elbow x,y, hand x,y relative to head centre

export function Head({ skin = "s1", hair = "h1", style = "short", r = 13 }: { skin?: Skin; hair?: Hair; style?: "short" | "long" | "bun" | "curly" | "cap"; r?: number }) {
  const s = SKIN[skin], h = HAIR[hair];
  return (
    <g>
      {style === "long" && <rect x={-r - 1.5} y={-r - 1} width={2 * r + 3} height={r * 2.5} rx={r * 0.9} fill={h} />}
      {style === "bun" && <circle cx={0} cy={-r - 4} r={6} fill={h} />}
      {style === "curly" && [-9, 0, 9].map((x) => <circle key={x} cx={x} cy={-r + 3} r={7} fill={h} />)}
      <circle cx={0} cy={-2} r={r + 1} fill={h} />
      <circle cx={0} cy={1.5} r={r - 1} fill={s} />
      {style === "cap" && <path d={`M${-r} -3 a${r} ${r} 0 0 1 ${2 * r} 0 z`} fill={h} />}
      <circle cx={-4.5} cy={2.5} r={1.3} fill={C.ink} />
      <circle cx={4.5} cy={2.5} r={1.3} fill={C.ink} />
      <path d="M-3 7 q3 2.4 6 0" stroke={C.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  );
}

// A standing / seated figure drawn around the head centre (0,0).
export function Figure({
  x, y, s = 1, skin = "s1", hair = "h1", style = "short", shirt = C.ind, pants = C.ink, shoes = C.coral,
  armL = [-15, 34, -12, 50], armR = [15, 34, 12, 50], legs = "stand", flip = false, tie, children, before,
}: {
  x: number; y: number; s?: number; skin?: Skin; hair?: Hair; style?: "short" | "long" | "bun" | "curly" | "cap";
  shirt?: string; pants?: string; shoes?: string; armL?: Arm; armR?: Arm; legs?: "stand" | "none" | "walk"; flip?: boolean; tie?: string;
  children?: ReactNode; before?: ReactNode;
}) {
  const sk = SKIN[skin];
  const arm = (a: Arm, side: -1 | 1) => (
    <g>
      <path d={`M${side * 10} 21 L${a[0]} ${a[1]}`} stroke={shirt} strokeWidth={8.5} strokeLinecap="round" fill="none" />
      <path d={`M${a[0]} ${a[1]} L${a[2]} ${a[3]}`} stroke={sk} strokeWidth={6.5} strokeLinecap="round" fill="none" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {before}
      {legs === "stand" && (
        <g>
          <rect x={-11} y={46} width={10} height={44} rx={5} fill={pants} />
          <rect x={1} y={46} width={10} height={44} rx={5} fill={pants} />
          <ellipse cx={-6} cy={92} rx={9} ry={4.5} fill={shoes} />
          <ellipse cx={7} cy={92} rx={9} ry={4.5} fill={shoes} />
        </g>
      )}
      {legs === "walk" && (
        <g>
          <path d="M-5 46 L-16 88" stroke={pants} strokeWidth={10} strokeLinecap="round" />
          <path d="M5 46 L14 88" stroke={pants} strokeWidth={10} strokeLinecap="round" />
          <ellipse cx={-19} cy={92} rx={9} ry={4.5} fill={shoes} />
          <ellipse cx={18} cy={92} rx={9} ry={4.5} fill={shoes} />
        </g>
      )}
      <rect x={-6} y={11} width={12} height={9} rx={4} fill={sk} />
      {arm(armL, -1)}
      <rect x={-13} y={15} width={26} height={36} rx={11} fill={shirt} />
      {tie && <path d="M0 17 l3.5 4 -3.5 22 -3.5 -22z" fill={tie} />}
      {arm(armR, 1)}
      <Head skin={skin} hair={hair} style={style} />
      {children}
    </g>
  );
}

export function Plant({ x, y, s = 1, pot = C.coral }: { x: number; y: number; s?: number; pot?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -52 C-22 -44 -26 -18 0 -4 C26 -18 22 -44 0 -52z" fill={C.leaf} />
      <path d="M-4 -30 C-34 -34 -40 -6 -6 -4 C-10 -16 -8 -24 -4 -30z" fill={C.leafL} />
      <path d="M4 -30 C32 -26 38 -4 6 -4 C10 -16 8 -24 4 -30z" fill={C.leaf} />
      <path d="M-16 -2 h32 l-4 28 h-24z" fill={pot} />
      <rect x={-18} y={-4} width={36} height={7} rx={3} fill={pot} opacity={0.85} />
    </g>
  );
}

export function Star({ x, y, r = 8, fill = C.sun }: { x: number; y: number; r?: number; fill?: string }) {
  const p = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.35 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return <polygon points={p.join(" ")} fill={fill} />;
}

export function Plus({ x, y, r = 6, c = C.coral }: { x: number; y: number; r?: number; c?: string }) {
  return <path d={`M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}`} stroke={c} strokeWidth={3} strokeLinecap="round" />;
}

export function Ring({ x, y, r = 7, c = C.teal }: { x: number; y: number; r?: number; c?: string }) {
  return <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={3} />;
}

export function Book({ x, y, w = 60, h = 12, c = C.ind, page = C.white, rot = 0 }: { x: number; y: number; w?: number; h?: number; c?: string; page?: string; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={c} />
      <rect x={x + 5} y={y + 2} width={w - 8} height={h - 4} rx={2} fill={page} />
      <rect x={x} y={y} width={7} height={h} rx={3} fill={c} />
    </g>
  );
}

export function Svg({ vb, children, className, label }: { vb: string; children: ReactNode; className?: string; label?: string }) {
  return (
    <svg viewBox={vb} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}
