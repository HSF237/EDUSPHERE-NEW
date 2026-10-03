import { Book, C, Figure, Plant, Plus, Ring, Star, Svg } from "./kit";

type P = { className?: string };

function Shadow({ x, y, w = 40 }: { x: number; y: number; w?: number }) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 0.16} fill={C.ink} opacity={0.12} />;
}

/** Big classroom scene — used on the login page and the landing hero. */
export function SceneClassroom({ className }: P) {
  const desk = (x: number) => (
    <g>
      <rect x={x - 52} y={345} width={104} height={13} rx={5} fill={C.wood} />
      <rect x={x - 45} y={357} width={90} height={54} rx={5} fill={C.woodD} />
    </g>
  );
  return (
    <Svg vb="0 0 640 480" className={className} label="A teacher at the board with three students at their desks">
      <path d="M52 250C34 120 170 36 322 46C474 56 612 112 598 250C586 384 474 450 322 450C170 450 70 382 52 250Z" fill={C.ind3} />
      <circle cx={548} cy={96} r={40} fill={C.sunL} />
      <circle cx={548} cy={96} r={24} fill={C.sun} />
      <circle cx={92} cy={398} r={64} fill={C.mint} opacity={0.8} />
      {/* clock */}
      <circle cx={320} cy={58} r={24} fill={C.white} stroke={C.woodD} strokeWidth={5} />
      <path d="M320 58V43M320 58l10 7" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      {/* board */}
      <rect x={168} y={96} width={304} height={172} rx={12} fill={C.deep} stroke={C.woodD} strokeWidth={8} />
      <rect x={176} y={266} width={288} height={9} rx={4} fill={C.woodD} />
      <text x={196} y={150} fill={C.white} fontSize={26} fontWeight={700} fontFamily="ui-sans-serif,system-ui,sans-serif">A² + B² = C²</text>
      <path d="M200 230V176L262 230Z" fill="none" stroke={C.sun} strokeWidth={3} strokeLinejoin="round" />
      <path d="M200 218h12v12" fill="none" stroke={C.sun} strokeWidth={2.5} />
      {[[300, 36, C.coral], [326, 58, C.sun], [352, 22, C.teal], [378, 46, C.ind2]].map(([x, h, c]) => (
        <rect key={String(x)} x={Number(x)} y={230 - Number(h)} width={18} height={Number(h)} rx={3} fill={String(c)} />
      ))}
      <ellipse cx={425} cy={185} rx={32} ry={12} fill="none" stroke={C.mint} strokeWidth={2.5} />
      <ellipse cx={425} cy={185} rx={32} ry={12} fill="none" stroke={C.mint} strokeWidth={2.5} transform="rotate(60 425 185)" />
      <circle cx={425} cy={185} r={5} fill={C.sun} />
      {/* teacher */}
      <Shadow x={548} y={380} w={46} />
      <path d="M476 262L412 212" stroke={C.wood} strokeWidth={4} strokeLinecap="round" />
      <Figure x={548} y={246} s={1.45} skin="s2" hair="h3" shirt={C.coral} pants={C.ink} shoes={C.sun} armL={[-30, 26, -58, 12]} armR={[17, 38, 15, 54]}>
        <path d="M-10 19 L0 31 L10 19" stroke={C.white} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
      </Figure>
      {/* students */}
      <Figure x={200} y={305} s={1.15} skin="s3" hair="h3" style="curly" shirt={C.coral} legs="none" armL={[-17, 32, -12, 44]} armR={[17, 32, 12, 44]} />
      <Figure x={330} y={305} s={1.15} skin="s1" hair="h2" style="long" shirt={C.sun} legs="none" armL={[-17, 32, -12, 44]} armR={[22, 12, 24, -14]} />
      <Figure x={460} y={305} s={1.15} skin="s2" hair="h1" style="bun" shirt={C.ind} legs="none" armL={[-17, 32, -12, 44]} armR={[17, 32, 12, 44]} />
      {desk(200)}{desk(330)}{desk(460)}
      {/* laptop on first desk */}
      <path d="M176 346l6-26h36l6 26z" fill={C.grey} />
      <circle cx={200} cy={333} r={3.5} fill={C.ind2} />
      <rect x={170} y={344} width={60} height={5} rx={2.5} fill="#c4c8d9" />
      {/* open book on second desk */}
      <path d="M330 346l-34-5v-8l34 5z" fill={C.white} />
      <path d="M330 346l34-5v-8l-34 5z" fill={C.sunL} />
      {/* notebook on third desk */}
      <rect x={440} y={338} width={34} height={8} rx={2} fill={C.teal} />
      <rect x={444} y={334} width={34} height={6} rx={2} fill={C.white} />
      <path d="M492 345l16-13 4 4-16 13z" fill={C.coral} />
      {/* decor */}
      <Plant x={86} y={392} s={1.25} pot={C.sun} />
      <Book x={36} y={402} w={92} h={18} c={C.ind} />
      <Book x={44} y={384} w={76} h={18} c={C.coral} />
      <Star x={118} y={128} r={12} />
      <Star x={600} y={190} r={9} fill={C.coral} />
      <Plus x={116} y={220} c={C.coral} />
      <Plus x={528} y={170} r={5} c={C.teal} />
      <Ring x={596} y={300} c={C.teal} />
      <Ring x={142} y={304} r={5} c={C.ind2} />
      <path d="M244 64l26 8-8 3 3 9-6-6-6 5z" fill={C.white} stroke={C.ind2} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

/** Student reading on a bean bag. */
export function SceneReader({ className }: P) {
  return (
    <Svg vb="0 0 480 360" className={className} label="A student reading a book on a bean bag">
      <path d="M40 190C30 90 140 28 250 34C360 40 456 100 446 200C436 296 350 336 240 336C130 336 50 290 40 190Z" fill={C.mint} />
      <circle cx={392} cy={84} r={30} fill={C.sunL} />
      <circle cx={392} cy={84} r={17} fill={C.sun} />
      <Book x={58} y={296} w={120} h={24} c={C.ind} />
      <Book x={66} y={272} w={104} h={24} c={C.coral} />
      <Book x={74} y={250} w={92} h={22} c={C.teal} />
      <Plant x={118} y={248} s={0.85} pot={C.sun} />
      <path d="M170 306C168 240 400 238 394 306C392 346 172 350 170 306Z" fill={C.coral} />
      <path d="M200 296C230 280 330 280 360 296" stroke="#e5503d" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Figure x={282} y={148} s={1.35} skin="s2" hair="h1" style="long" shirt={C.ind} legs="none" armL={[-26, 40, -17, 52]} armR={[26, 40, 17, 52]}>
        <path d="M-10 46C-40 50 -54 70 -38 82C-22 90 4 80 6 58Z" fill={C.deep} />
        <path d="M10 46C40 50 54 70 38 82C22 90 -4 80 -6 58Z" fill={C.deep} />
        <ellipse cx={-38} cy={80} rx={8} ry={5} fill={C.coral} />
        <ellipse cx={38} cy={80} rx={8} ry={5} fill={C.coral} />
        <path d="M0 40L-30 35V62L0 67Z" fill={C.white} />
        <path d="M0 40L30 35V62L0 67Z" fill={C.sunL} />
        <path d="M-24 44h18M-24 50h18M6 44h18M6 50h18" stroke={C.ind4} strokeWidth={1.6} strokeLinecap="round" />
      </Figure>
      <Plant x={428} y={304} s={1.4} pot={C.ind} />
      <Book x={338} y={96} w={52} h={12} c={C.coral} rot={-18} />
      <Star x={90} y={120} r={11} />
      <Star x={352} y={190} r={7} fill={C.coral} />
      <Plus x={196} y={78} c={C.teal} />
      <Ring x={118} y={196} r={6} c={C.ind2} />
    </Svg>
  );
}

/** Person with a laptop surrounded by floating tool cards — staff dashboard. */
export function SceneLaptop({ className }: P) {
  const card = (x: number, y: number, c: React.ReactNode) => (
    <g>
      <rect x={x} y={y} width={64} height={52} rx={12} fill={C.white} />
      {c}
    </g>
  );
  return (
    <Svg vb="0 0 480 360" className={className} label="A teacher working on a laptop with school tools floating around">
      <path d="M44 196C36 94 150 30 256 36C366 42 450 104 440 204C430 296 346 334 240 334C136 334 52 296 44 196Z" fill={C.ind3} />
      <circle cx={238} cy={196} r={104} fill={C.white} opacity={0.5} />
      <Shadow x={240} y={300} w={86} />
      <Figure x={240} y={128} s={1.4} skin="s1" hair="h2" style="short" shirt="#eef2ff" legs="none" armL={[-26, 40, -14, 58]} armR={[26, 40, 14, 58]}>
        <path d="M-12 46C-48 50 -64 72 -46 86C-28 96 6 84 8 60Z" fill={C.ind} />
        <path d="M12 46C48 50 64 72 46 86C28 96 -6 84 -8 60Z" fill={C.ind} />
        <ellipse cx={-46} cy={88} rx={9} ry={5} fill={C.coral} />
        <ellipse cx={46} cy={88} rx={9} ry={5} fill={C.coral} />
        <rect x={-30} y={28} width={60} height={36} rx={4} fill="#cbd5e1" />
        <rect x={-34} y={62} width={68} height={6} rx={3} fill="#94a3b8" />
        <circle cx={0} cy={46} r={4} fill={C.white} />
      </Figure>
      {card(66, 76, <g><circle cx={98} cy={98} r={11} fill={C.sun} /><rect x={92} y={110} width={12} height={6} rx={2} fill={C.woodD} /><path d="M98 66v-4M80 72l-3-3M116 72l3-3" stroke={C.sun} strokeWidth={2.5} strokeLinecap="round" /></g>)}
      {card(350, 70, <g><rect x={364} y={104} width={9} height={16} rx={2} fill={C.coral} /><rect x={377} y={96} width={9} height={24} rx={2} fill={C.teal} /><rect x={390} y={86} width={9} height={34} rx={2} fill={C.ind} /></g>)}
      {card(60, 226, <g><path d="M78 252l8 8 14-16" stroke={C.teal} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M78 272h40" stroke={C.grey} strokeWidth={4} strokeLinecap="round" /></g>)}
      {card(356, 222, <g><Book x={366} y={244} w={44} h={10} c={C.ind} /><Book x={366} y={258} w={44} h={10} c={C.coral} /></g>)}
      <circle cx={236} cy={44} r={20} fill="none" stroke={C.ind2} strokeWidth={5} strokeDasharray="6 7" />
      <circle cx={236} cy={44} r={7} fill={C.ind2} />
      <path d="M418 296c0-14 8-22 8-32M410 292c0-10 6-16 6-24" stroke={C.ind2} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <rect x={400} y={296} width={32} height={26} rx={7} fill={C.coral} />
      <Plant x={46} y={318} s={1.1} pot={C.teal} />
      <Star x={152} y={50} r={10} />
      <Star x={430} y={160} r={8} fill={C.coral} />
      <Plus x={120} y={160} c={C.coral} />
      <Ring x={332} y={298} r={6} c={C.teal} />
    </Svg>
  );
}

/** Parent walking with a child — parent dashboard. */
export function SceneParent({ className }: P) {
  return (
    <Svg vb="0 0 480 360" className={className} label="A parent holding hands with a child on the way to school">
      <path d="M40 200C32 96 150 32 258 38C366 44 454 104 444 204C434 300 346 338 240 338C134 338 48 300 40 200Z" fill={C.peach} />
      <circle cx={392} cy={90} r={34} fill={C.sunL} />
      <circle cx={392} cy={90} r={19} fill={C.sun} />
      <path d="M92 118h64a14 14 0 0 1 0 28H80a12 12 0 0 1 12-28zM300 76h56a12 12 0 0 1 0 24h-64a10 10 0 0 1 8-24z" fill={C.white} />
      {/* school in the distance */}
      <rect x={338} y={196} width={92} height={62} rx={4} fill={C.ind3} />
      <path d="M330 198L384 160l54 38z" fill={C.ind2} />
      <rect x={374} y={226} width={20} height={32} rx={3} fill={C.ind} />
      <path d="M384 160v-26" stroke={C.deep} strokeWidth={3} /><path d="M384 134h16l-4 6 4 6h-16z" fill={C.coral} />
      <circle cx={86} cy={214} r={30} fill={C.leaf} /><circle cx={104} cy={196} r={22} fill={C.leafL} /><rect x={92} y={232} width={8} height={36} rx={3} fill={C.woodD} />
      <path d="M78 272C150 258 330 258 402 272V294C330 314 150 314 78 294Z" fill={C.leafL} opacity={0.6} />
      <Shadow x={222} y={312} w={90} />
      {/* parent */}
      <Figure x={178} y={102} s={1.45} skin="s3" hair="h3" style="long" shirt={C.coral} legs="none" armL={[-20, 40, -18, 62]} armR={[24, 38, 40, 62]}>
        <path d="M-13 46L-24 92H24L13 46Z" fill={C.ind} />
        <ellipse cx={-8} cy={94} rx={9} ry={4.5} fill={C.ink} />
        <ellipse cx={9} cy={94} rx={9} ry={4.5} fill={C.ink} />
      </Figure>
      {/* child with backpack */}
      <Figure x={262} y={152} s={0.88} skin="s2" hair="h4" style="curly" shirt={C.teal} pants={C.deep} armL={[-26, 32, -38, 36]} armR={[16, 36, 14, 52]}
        before={<rect x={-16} y={14} width={32} height={36} rx={10} fill={C.sun} />} />
      <Star x={90} y={86} r={11} fill={C.coral} />
      <Star x={440} y={206} r={7} />
      <Plus x={64} y={150} c={C.teal} />
      <Ring x={440} y={152} r={6} c={C.coral} />
    </Svg>
  );
}

/** Campus with connected schools — platform admin. */
export function SceneCampus({ className }: P) {
  const bld = (x: number, y: number, s: number, c: string, roof: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={0} y={30} width={90} height={60} rx={4} fill={c} />
      <path d="M-8 32L45 0l53 32z" fill={roof} />
      <rect x={36} y={56} width={18} height={34} rx={3} fill={C.ink} opacity={0.75} />
      <rect x={10} y={46} width={16} height={16} rx={3} fill={C.white} opacity={0.85} /><rect x={64} y={46} width={16} height={16} rx={3} fill={C.white} opacity={0.85} />
    </g>
  );
  return (
    <Svg vb="0 0 480 360" className={className} label="A network of schools connected to one platform">
      <path d="M40 196C32 92 148 30 256 36C366 42 454 104 444 204C434 298 346 336 240 336C134 336 48 298 40 196Z" fill={C.ind3} />
      <path d="M118 150C150 100 330 100 362 150M118 150C100 200 130 232 140 240M362 150C380 200 350 232 340 240" stroke={C.ind2} strokeWidth={3} fill="none" strokeDasharray="5 7" />
      {bld(64, 190, 0.8, C.white, C.coral)}
      {bld(342, 196, 0.76, C.white, C.teal)}
      <rect x={176} y={150} width={128} height={118} rx={6} fill={C.white} />
      <path d="M164 154L240 98l76 56z" fill={C.ind} />
      <rect x={224} y={206} width={32} height={62} rx={5} fill={C.deep} />
      {[188, 276].map((x) => <g key={x}><rect x={x - 4} y={176} width={24} height={26} rx={4} fill={C.ind3} /><rect x={x - 4} y={220} width={24} height={26} rx={4} fill={C.ind3} /></g>)}
      <circle cx={240} cy={134} r={12} fill={C.white} /><path d="M240 134v-7M240 134l5 3" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M240 98V66" stroke={C.deep} strokeWidth={3.5} /><path d="M240 66h26l-6 9 6 9h-26z" fill={C.coral} />
      <path d="M200 268h80v10h-96v-10z" fill="#d6dcf5" />
      <Plant x={158} y={286} s={0.85} pot={C.sun} /><Plant x={322} y={286} s={0.85} pot={C.coral} />
      {[[88, 120, C.coral], [392, 124, C.teal], [240, 40, C.sun]].map(([x, y, c]) => (
        <g key={String(x)}><circle cx={Number(x)} cy={Number(y)} r={17} fill={C.white} /><circle cx={Number(x)} cy={Number(y) - 4} r={5} fill={String(c)} /><path d={`M${Number(x) - 8} ${Number(y) + 8}a8 6 0 0 1 16 0z`} fill={String(c)} /></g>
      ))}
      <Star x={430} y={256} r={9} /><Plus x={54} y={276} c={C.coral} /><Ring x={420} y={70} r={6} c={C.coral} />
    </Svg>
  );
}
