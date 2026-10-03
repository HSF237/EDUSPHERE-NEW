import { Book, C, Plus, Ring, Star, Svg } from "./kit";

export type SpotName =
  | "attendance" | "homework" | "diary" | "timetable" | "exams" | "leave" | "messages" | "announcements" | "ptm"
  | "substitutes" | "students" | "teachers" | "classes" | "reports" | "notifications" | "settings" | "schools" | "empty" | "dashboard";

const Back = ({ c }: { c: string }) => <path d="M18 80C12 34 62 10 104 12C152 14 190 40 184 84C178 124 142 142 100 142C58 142 22 124 18 80Z" fill={c} />;
const Face = ({ x, y, r = 14, skin = "#f6cba7", hair = "#2a2140" }: { x: number; y: number; r?: number; skin?: string; hair?: string }) => (
  <g>
    <circle cx={x} cy={y - 2} r={r + 1} fill={hair} />
    <circle cx={x} cy={y + 1.5} r={r - 1} fill={skin} />
    <circle cx={x - r * 0.33} cy={y + 2.5} r={1.2} fill={C.ink} /><circle cx={x + r * 0.33} cy={y + 2.5} r={1.2} fill={C.ink} />
    <path d={`M${x - 3} ${y + 7}q3 2.4 6 0`} stroke={C.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </g>
);
const Body = ({ x, y, w = 38, h = 30, c }: { x: number; y: number; w?: number; h?: number; c: string }) => <rect x={x - w / 2} y={y} width={w} height={h} rx={w / 3} fill={c} />;
const Gear = ({ x, y, r, c, t = 8, hole = C.white }: { x: number; y: number; r: number; c: string; t?: number; hole?: string }) => (
  <g>
    {Array.from({ length: t }).map((_, i) => <rect key={i} x={x - r * 0.18} y={y - r * 1.2} width={r * 0.36} height={r * 0.5} rx={2} fill={c} transform={`rotate(${(360 / t) * i} ${x} ${y})`} />)}
    <circle cx={x} cy={y} r={r} fill={c} /><circle cx={x} cy={y} r={r * 0.4} fill={hole} />
  </g>
);

export function Spot({ name, className }: { name: SpotName; className?: string }) {
  return (
    <Svg vb="0 0 200 150" className={className}>
      {name === "attendance" && (<g>
        <Back c={C.mint} />
        <rect x={46} y={30} width={96} height={92} rx={12} fill={C.white} />
        <path d="M46 42a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12v14H46z" fill={C.coral} />
        <rect x={68} y={20} width={7} height={18} rx={3.5} fill={C.deep} /><rect x={113} y={20} width={7} height={18} rx={3.5} fill={C.deep} />
        {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((k) => <rect key={`${r}${k}`} x={58 + k * 21} y={66 + r * 13} width={12} height={8} rx={3} fill={(r * 4 + k) % 5 === 0 ? C.ind4 : C.grey} />))}
        <circle cx={144} cy={108} r={21} fill={C.teal} /><path d="M133 108l8 8 14-16" stroke={C.white} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Star x={30} y={42} r={9} /><Plus x={168} y={40} c={C.coral} />
      </g>)}
      {name === "homework" && (<g>
        <Back c={C.peach} />
        <rect x={52} y={22} width={72} height={86} rx={8} fill={C.white} transform="rotate(-6 88 66)" />
        <path d="M64 44h40M64 58h46M64 72h32" stroke={C.ind4} strokeWidth={4} strokeLinecap="round" transform="rotate(-6 88 66)" />
        <path d="M64 87l6 6 11-12" stroke={C.teal} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-6 88 66)" />
        <Book x={80} y={110} w={90} h={16} c={C.ind} /><Book x={88} y={96} w={74} h={14} c={C.coral} />
        <rect x={134} y={34} width={10} height={62} rx={3} fill={C.sun} transform="rotate(24 139 65)" /><path d="M156 88l-5 12 12-4z" fill={C.woodD} />
        <Star x={32} y={110} r={8} fill={C.coral} />
      </g>)}
      {name === "diary" && (<g>
        <Back c={C.ind3} />
        <rect x={54} y={20} width={86} height={106} rx={9} fill={C.ind} />
        <rect x={62} y={26} width={72} height={94} rx={6} fill={C.white} />
        <path d="M72 46h50M72 60h50M72 74h34M72 88h42" stroke={C.ind4} strokeWidth={4} strokeLinecap="round" />
        {[34, 52, 70, 88, 106].map((y) => <rect key={y} x={46} y={y} width={16} height={6} rx={3} fill={C.deep} />)}
        <path d="M122 20v26l8-6 8 6V20z" fill={C.coral} />
        <rect x={148} y={50} width={9} height={52} rx={3} fill={C.sun} transform="rotate(28 152 76)" />
        <Star x={166} y={28} r={9} /><Ring x={34} y={110} c={C.teal} r={6} />
      </g>)}
      {name === "timetable" && (<g>
        <Back c={C.sunL} />
        <rect x={34} y={42} width={84} height={70} rx={10} fill={C.white} />
        {[0, 1, 2].map((r) => [0, 1, 2].map((k) => <rect key={`${r}${k}`} x={42 + k * 25} y={50 + r * 20} width={20} height={14} rx={4} fill={[C.coral, C.teal, C.ind2, C.sun, C.ind4][(r + k * 2) % 5]} />))}
        <circle cx={140} cy={74} r={36} fill={C.white} stroke={C.ind} strokeWidth={8} />
        <path d="M140 74V50M140 74l17 10" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
        <circle cx={140} cy={74} r={4} fill={C.coral} />
        <Star x={28} y={28} r={9} fill={C.coral} /><Plus x={176} y={124} c={C.teal} />
      </g>)}
      {name === "exams" && (<g>
        <Back c={C.peach} />
        <rect x={54} y={18} width={88} height={108} rx={9} fill={C.white} transform="rotate(5 98 72)" />
        <g transform="rotate(5 98 72)">
          <text x={68} y={70} fill={C.coral} fontSize={38} fontWeight={800} fontFamily="ui-sans-serif,system-ui,sans-serif">A+</text>
          <path d="M68 86h60M68 98h44M68 110h52" stroke={C.ind4} strokeWidth={4} strokeLinecap="round" /><path d="M66 38h50" stroke={C.grey} strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle cx={150} cy={36} r={20} fill={C.sun} /><path d="M150 24l4 8 9 1-6.500 6.200 1.600 9-8.100-4.300-8.100 4.300 1.600-9L137 33l9-1z" fill={C.white} />
        <Plus x={30} y={50} c={C.teal} /><Ring x={168} y={112} c={C.ind2} r={6} />
      </g>)}
      {name === "leave" && (<g>
        <Back c={C.mint} />
        <rect x={40} y={56} width={110} height={68} rx={10} fill={C.white} />
        <path d="M40 66l55 34 55-34" stroke={C.teal} strokeWidth={5} fill="none" strokeLinejoin="round" />
        <path d="M62 24l62 22-18 8 6 20-16-14-14 8z" fill={C.ind} /><path d="M124 46l-30 20" stroke={C.ind4} strokeWidth={2.5} />
        <circle cx={160} cy={32} r={14} fill={C.sun} /><Plus x={30} y={34} c={C.coral} />
      </g>)}
      {name === "messages" && (<g>
        <Back c={C.ind3} />
        <path d="M36 32a16 16 0 0 1 16-16h66a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H70l-20 16V80h-2a12 12 0 0 1-12-12z" fill={C.ind} />
        <circle cx={70} cy={48} r={5} fill={C.white} /><circle cx={92} cy={48} r={5} fill={C.white} /><circle cx={114} cy={48} r={5} fill={C.white} />
        <path d="M94 76a14 14 0 0 1 14-14h50a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14h-2v14l-18-14h-30a14 14 0 0 1-14-14z" fill={C.coral} transform="translate(0 6)" />
        <path d="M112 90h44M112 102h30" stroke={C.white} strokeWidth={4.500} strokeLinecap="round" />
        <Star x={176} y={26} r={9} /><Ring x={26} y={118} r={6} c={C.teal} />
      </g>)}
      {name === "announcements" && (<g>
        <Back c={C.sunL} />
        <path d="M44 68l78-34v80L44 86z" fill={C.coral} />
        <rect x={30} y={62} width={22} height={30} rx={8} fill={C.deep} />
        <rect x={116} y={30} width={14} height={88} rx={7} fill="#e5503d" />
        <path d="M60 94l8 30h18l-8-34z" fill={C.deep} />
        <path d="M144 52c10 8 10 28 0 36M156 40c18 14 18 50 0 64" stroke={C.ind} strokeWidth={5} strokeLinecap="round" fill="none" />
        <Star x={30} y={30} r={9} fill={C.ind2} /><Plus x={176} y={118} c={C.teal} /><Ring x={162} y={22} r={5} c={C.coral} />
      </g>)}
      {name === "ptm" && (<g>
        <Back c={C.peach} />
        <Body x={68} y={78} c={C.ind} h={46} /><Face x={68} y={64} r={16} skin="#cf9367" />
        <Body x={134} y={78} c={C.teal} h={46} /><Face x={134} y={64} r={16} hair="#7a4a2b" />
        <path d="M82 28a12 12 0 0 1 12-12h42a12 12 0 0 1 12 12v12a12 12 0 0 1-12 12h-22l-12 10v-10h-8a12 12 0 0 1-12-12z" fill={C.white} />
        <circle cx={104} cy={34} r={3.500} fill={C.coral} /><circle cx={116} cy={34} r={3.500} fill={C.sun} /><circle cx={128} cy={34} r={3.500} fill={C.ind2} />
        <Star x={170} y={20} r={8} />
      </g>)}
      {name === "substitutes" && (<g>
        <Back c={C.mint} />
        <Body x={58} y={80} c={C.coral} h={42} /><Face x={58} y={66} r={15} skin="#8f5e3f" hair="#111827" />
        <Body x={142} y={80} c={C.ind} h={42} /><Face x={142} y={66} r={15} />
        <path d="M80 36h42M122 36l-9-8M122 36l-9 8" stroke={C.teal} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 112H78M78 112l9-8M78 112l9 8" stroke={C.sun} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>)}
      {name === "students" && (<g>
        <Back c={C.ind3} />
        <Body x={58} y={86} c={C.coral} h={40} /><Face x={58} y={72} r={14} skin="#cf9367" hair="#111827" />
        <Body x={142} y={86} c={C.sun} h={40} /><Face x={142} y={72} r={14} hair="#c2410c" />
        <Body x={100} y={74} w={44} h={54} c={C.ind} /><Face x={100} y={58} r={17} skin="#8f5e3f" />
        <Star x={32} y={32} r={9} /><Plus x={170} y={34} c={C.teal} /><Ring x={168} y={118} r={6} c={C.coral} />
      </g>)}
      {name === "teachers" && (<g>
        <Back c={C.peach} />
        <rect x={26} y={26} width={96} height={64} rx={7} fill={C.deep} stroke={C.woodD} strokeWidth={5} />
        <path d="M38 76l14-24 14 24zM78 44h30M78 56h22" stroke={C.white} strokeWidth={3.500} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Body x={150} y={80} w={40} h={46} c={C.teal} /><Face x={150} y={64} r={16} skin="#cf9367" hair="#111827" />
        <path d="M132 86l-22-18" stroke={C.wood} strokeWidth={4} strokeLinecap="round" />
        <Star x={170} y={24} r={9} /><Plus x={30} y={118} c={C.coral} />
      </g>)}
      {name === "classes" && (<g>
        <Back c={C.sunL} />
        {[["A", 38, 56, C.coral, -8], ["B", 84, 44, C.teal, 6], ["C", 130, 60, C.ind, -4]].map(([l, x, y, c, r]) => (
          <g key={String(l)} transform={`rotate(${r} ${Number(x) + 22} ${Number(y) + 22})`}>
            <rect x={Number(x)} y={Number(y)} width={44} height={44} rx={9} fill={String(c)} />
            <text x={Number(x) + 22} y={Number(y) + 32} textAnchor="middle" fill={C.white} fontSize={26} fontWeight={800} fontFamily="ui-sans-serif,system-ui,sans-serif">{String(l)}</text>
          </g>
        ))}
        <rect x={40} y={112} width={120} height={10} rx={5} fill={C.woodD} />
        <Star x={162} y={28} r={9} /><Ring x={30} y={30} r={6} c={C.ind2} />
      </g>)}
      {name === "reports" && (<g>
        <Back c={C.ind3} />
        <rect x={30} y={24} width={110} height={96} rx={11} fill={C.white} />
        {[[46, 34, C.coral], [68, 52, C.sun], [90, 28, C.teal], [112, 64, C.ind]].map(([x, h, c]) => <rect key={String(x)} x={Number(x)} y={106 - Number(h)} width={14} height={Number(h)} rx={3} fill={String(c)} />)}
        <path d="M40 54l30-8 22 12 36-26" stroke={C.ind} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={152} cy={92} r={28} fill={C.white} /><circle cx={152} cy={92} r={18} fill="none" stroke={C.grey} strokeWidth={9} />
        <circle cx={152} cy={92} r={18} fill="none" stroke={C.teal} strokeWidth={9} strokeDasharray="70 120" transform="rotate(-90 152 92)" strokeLinecap="round" />
        <Star x={166} y={28} r={9} />
      </g>)}
      {name === "notifications" && (<g>
        <Back c={C.sunL} />
        <path d="M100 20c-24 0-38 18-38 40v22l-12 16h100l-12-16V60c0-22-14-40-38-40z" fill={C.sun} />
        <path d="M62 82l-12 16h100l-12-16z" fill="#f2b100" />
        <path d="M86 102a14 14 0 0 0 28 0z" fill={C.coral} />
        <rect x={94} y={12} width={12} height={12} rx={6} fill={C.sun} />
        <circle cx={134} cy={36} r={13} fill={C.coral} /><text x={134} y={41} textAnchor="middle" fill={C.white} fontSize={14} fontWeight={800} fontFamily="ui-sans-serif,system-ui,sans-serif">3</text>
        <path d="M40 50c-8 8-8 24 0 32M28 40c-14 14-14 40 0 54" stroke={C.ind} strokeWidth={4.500} strokeLinecap="round" fill="none" />
        <Plus x={170} y={112} c={C.teal} /><Star x={30} y={118} r={7} fill={C.coral} />
      </g>)}
      {name === "settings" && (<g>
        <Back c={C.mint} />
        <Gear x={84} y={74} r={32} c={C.ind} t={8} hole={C.mint} />
        <Gear x={146} y={46} r={17} c={C.coral} t={8} hole={C.mint} />
        <Gear x={142} y={112} r={12} c={C.sun} t={8} hole={C.mint} />
        <Star x={30} y={30} r={8} /><Plus x={30} y={120} c={C.teal} />
      </g>)}
      {name === "schools" && (<g>
        <Back c={C.ind3} />
        <rect x={40} y={60} width={120} height={62} rx={6} fill={C.white} />
        <path d="M30 64L100 22l70 42z" fill={C.ind} />
        <rect x={86} y={86} width={28} height={36} rx={5} fill={C.deep} />
        {[52, 128].map((x) => <rect key={x} x={x} y={76} width={20} height={20} rx={4} fill={C.ind3} />)}
        <path d="M100 22V8" stroke={C.deep} strokeWidth={3} /><path d="M100 8h18l-4 6 4 6h-18z" fill={C.coral} />
        <Star x={24} y={30} r={8} /><Plus x={178} y={110} c={C.teal} />
      </g>)}
      {name === "dashboard" && (<g>
        <Back c={C.ind3} />
        <rect x={30} y={26} width={140} height={92} rx={12} fill={C.white} />
        <rect x={42} y={38} width={36} height={24} rx={6} fill={C.coral} /><rect x={84} y={38} width={36} height={24} rx={6} fill={C.teal} /><rect x={126} y={38} width={32} height={24} rx={6} fill={C.sun} />
        <path d="M42 106l24-18 20 10 28-26 40 16" stroke={C.ind} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Star x={170} y={22} r={9} />
      </g>)}
      {name === "empty" && (<g>
        <Back c={C.ind3} />
        <path d="M44 62l56-24 56 24-56 26z" fill={C.ind4} />
        <path d="M44 62v42l56 26V88z" fill={C.ind2} /><path d="M156 62v42l-56 26V88z" fill={C.ind} />
        <path d="M44 62l-12-18 38-14M156 62l12-18-38-14" stroke={C.ind2} strokeWidth={5} strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <circle cx={150} cy={34} r={14} fill="none" stroke={C.coral} strokeWidth={5} /><path d="M160 44l12 12" stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
        <Star x={34} y={26} r={9} /><Plus x={176} y={120} c={C.teal} /><Ring x={24} y={116} r={6} c={C.ind2} />
      </g>)}
    </Svg>
  );
}
