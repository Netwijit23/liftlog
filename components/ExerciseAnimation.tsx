'use client'

type AnimationType =
  | 'squat' | 'hip_thrust' | 'hinge' | 'pull_vertical'
  | 'pull_horizontal' | 'push_chest' | 'push_shoulder'
  | 'lateral_raise' | 'curl' | 'tricep' | 'kickback'
  | 'core_plank' | 'core_dead_bug' | 'generic'

const EXERCISE_MAP: [RegExp, AnimationType][] = [
  [/squat|leg press|lunge/i,              'squat'],
  [/hip thrust|glute bridge/i,            'hip_thrust'],
  [/romanian|rdl|deadlift/i,              'hinge'],
  [/lat pull|pulldown|pull.up|chin/i,     'pull_vertical'],
  [/row|cable row/i,                      'pull_horizontal'],
  [/chest press|bench|chest fly/i,        'push_chest'],
  [/shoulder press|overhead|ohp/i,        'push_shoulder'],
  [/lateral raise|side raise/i,           'lateral_raise'],
  [/bicep|curl(?!.*(tri|kick))/i,         'curl'],
  [/tricep|pushdown|skull/i,              'tricep'],
  [/kickback/i,                           'kickback'],
  [/plank|hollow/i,                       'core_plank'],
  [/dead bug|bird.dog|pallof/i,           'core_dead_bug'],
]

export function getAnimationType(name: string): AnimationType {
  for (const [p, t] of EXERCISE_MAP) if (p.test(name)) return t
  return 'generic'
}

const TIPS: Record<AnimationType, string> = {
  squat:           'Drive through heels · chest tall · knees track toes',
  hip_thrust:      'Squeeze glutes hard at the top · chin tucked',
  hinge:           'Hinge at hips · soft knee bend · bar close to legs',
  pull_vertical:   'Pull to collarbone · lead with elbows · shoulders down',
  pull_horizontal: 'Retract shoulder blades · don\'t shrug · controlled return',
  push_chest:      'Lower slowly · press up and slightly in · full range',
  push_shoulder:   'Core tight · don\'t arch back · lockout at top',
  lateral_raise:   'Slight forward lean · lead with elbows · no shrug',
  curl:            'Upper arm stays pinned · slow on the way down',
  tricep:          'Elbows tucked tight · fully extend every rep',
  kickback:        'Upper arm parallel to floor · squeeze at full extension',
  core_plank:      'Straight line head to heel · breathe steadily',
  core_dead_bug:   'Lower back glued down · opposite arm + leg extends',
  generic:         'Controlled movement · full range of motion',
}

// ── Shared SVG primitives ──────────────────────────────────────────────────

const C = '#1C1C1E'      // figure body
const P = '#F472B6'      // pink accent
const PD = '#DB2777'     // deep pink
const PL = 'rgba(244,114,182,0.18)'  // muscle highlight fill
const PLB = 'rgba(244,114,182,0.55)' // muscle highlight border

// Limb: stroke-based, rounded caps — much more natural than rects
function Limb({ x1,y1,x2,y2,w=10,color=C }:{x1:number;y1:number;x2:number;y2:number;w?:number;color?:string}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round"/>
}
function Head({ cx,cy,r=9 }:{cx:number;cy:number;r?:number}) {
  return <circle cx={cx} cy={cy} r={r} fill={C}/>
}
// Dumbbell
function DB({ x,y,angle=0 }:{x:number;y:number;angle?:number}) {
  return (
    <g transform={`rotate(${angle},${x},${y})`}>
      <rect x={x-14} y={y-3} width={28} height={6} rx={3} fill={PD}/>
      <rect x={x-18} y={y-5} width={6} height={10} rx={2} fill={P}/>
      <rect x={x+12} y={y-5} width={6} height={10} rx={2} fill={P}/>
    </g>
  )
}
// Weight plate circle
function Plate({ cx,cy,r=9 }:{cx:number;cy:number;r?:number}) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={P} strokeWidth={4}/>
}
// Motion arc
function Arc({ d,opacity=0.5 }:{d:string;opacity?:number}) {
  return <path d={d} fill="none" stroke={P} strokeWidth={2} strokeDasharray="4 3" opacity={opacity} strokeLinecap="round"/>
}
// Muscle glow region
function Muscle({ d,animate=true }:{d:string;animate?:boolean}) {
  return (
    <>
      <path d={d} fill={PL} stroke={PLB} strokeWidth={1.5}>
        {animate && <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>}
      </path>
    </>
  )
}

// ── SQUAT ──────────────────────────────────────────────────────────────────
function SquatAnim() {
  return (
    <svg viewBox="0 0 120 150" className="w-full h-full">
      <defs>
        <linearGradient id="sq-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={P}/>
          <stop offset="100%" stopColor={PD}/>
        </linearGradient>
      </defs>
      <style>{`
        @keyframes sq-body { 0%,100%{transform:translateY(0)} 45%{transform:translateY(26px)} }
        @keyframes sq-thigh { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(52deg)} }
        @keyframes sq-thigh-r { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-52deg)} }
        @keyframes sq-shin { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-48deg)} }
        @keyframes sq-shin-r { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(48deg)} }
        @keyframes sq-arm { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(12deg)} }
        .sq-body{animation:sq-body 2.4s ease-in-out infinite}
        .sq-tl{animation:sq-thigh 2.4s ease-in-out infinite;transform-origin:48px 90px}
        .sq-tr{animation:sq-thigh-r 2.4s ease-in-out infinite;transform-origin:72px 90px}
        .sq-sl{animation:sq-shin 2.4s ease-in-out infinite;transform-origin:41px 118px}
        .sq-sr{animation:sq-shin-r 2.4s ease-in-out infinite;transform-origin:79px 118px}
        .sq-al{animation:sq-arm 2.4s ease-in-out infinite;transform-origin:33px 50px}
        .sq-ar{animation:sq-arm 2.4s ease-in-out infinite;transform-origin:87px 50px;animation-direction:reverse}
      `}</style>

      {/* Ground */}
      <rect x="10" y="138" width="100" height="3" rx="1.5" fill={PL}/>

      {/* Static feet */}
      <ellipse cx="42" cy="138" rx="10" ry="4" fill={C} opacity="0.3"/>
      <ellipse cx="78" cy="138" rx="10" ry="4" fill={C} opacity="0.3"/>

      {/* Shins (static lower leg, rotate from knee) */}
      <g className="sq-sl"><Limb x1={41} y1={118} x2={42} y2={138} w={9}/></g>
      <g className="sq-sr"><Limb x1={79} y1={118} x2={78} y2={138} w={9}/></g>

      {/* Upper body group (moves up/down) */}
      <g className="sq-body">
        {/* Barbell */}
        <rect x="14" y="44" width="92" height="7" rx="3.5" fill="url(#sq-bar)"/>
        <Plate cx={16} cy={47}/>
        <Plate cx={104} cy={47}/>

        {/* Head */}
        <Head cx={60} cy={26}/>
        {/* Neck */}
        <Limb x1={60} y1={35} x2={60} y2={43} w={7}/>
        {/* Torso */}
        <Limb x1={60} y1={43} x2={60} y2={90} w={12}/>

        {/* Arms */}
        <g className="sq-al"><Limb x1={33} y1={50} x2={18} y2={72} w={8}/></g>
        <g className="sq-ar"><Limb x1={87} y1={50} x2={102} y2={72} w={8}/></g>

        {/* Glute highlight (visible at bottom of squat) */}
        <Muscle d="M45,85 Q60,100 75,85 Q72,95 60,97 Q48,95 45,85Z"/>

        {/* Thighs */}
        <g className="sq-tl"><Limb x1={48} y1={90} x2={41} y2={118} w={11}/></g>
        <g className="sq-tr"><Limb x1={72} y1={90} x2={79} y2={118} w={11}/></g>
      </g>

      {/* Depth arc */}
      <Arc d="M28,90 Q60,130 92,90" opacity={0.3}/>
    </svg>
  )
}

// ── HIP THRUST ─────────────────────────────────────────────────────────────
function HipThrustAnim() {
  return (
    <svg viewBox="0 0 150 120" className="w-full h-full">
      <style>{`
        @keyframes ht-hip { 0%,100%{transform:translateY(14px) rotate(-12deg)} 45%{transform:translateY(-3px) rotate(10deg)} }
        @keyframes ht-torso { 0%,100%{transform:rotate(-38deg)} 45%{transform:rotate(-8deg)} }
        @keyframes ht-shin { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-8deg)} }
        .ht-hip{animation:ht-hip 2.4s ease-in-out infinite;transform-origin:78px 82px}
        .ht-torso{animation:ht-torso 2.4s ease-in-out infinite;transform-origin:52px 72px}
        .ht-sl{animation:ht-shin 2.4s ease-in-out infinite;transform-origin:68px 100px}
        .ht-sr{animation:ht-shin 2.4s ease-in-out infinite;transform-origin:90px 100px}
      `}</style>

      {/* Bench */}
      <rect x="6" y="72" width="52" height="13" rx="6" fill={PL} stroke={P} strokeWidth="1.5"/>
      <Limb x1={14} y1={85} x2={14} y2={106} w={7} color="#e5e7eb"/>
      <Limb x1={50} y1={85} x2={50} y2={106} w={7} color="#e5e7eb"/>
      {/* Ground */}
      <rect x="6" y="106" width="138" height="3" rx="1.5" fill={PL}/>

      {/* Head resting on bench */}
      <Head cx={28} cy={62} r={10}/>

      {/* Torso hinged on bench shoulder */}
      <g className="ht-torso">
        <Limb x1={38} y1={68} x2={76} y2={78} w={13}/>
      </g>

      {/* Hip + legs group */}
      <g className="ht-hip">
        {/* Barbell across hips */}
        <rect x="52" y="74" width="74" height="8" rx="4" fill="url(#sq-bar)" opacity="0.9"/>
        <Plate cx={54} cy={78}/>
        <Plate cx={124} cy={78}/>
        {/* Glute muscle highlight */}
        <Muscle d="M60,78 Q79,68 98,78 Q95,90 79,92 Q63,90 60,78Z"/>
        {/* Upper thighs */}
        <Limb x1={68} y1={84} x2={64} y2={102} w={12}/>
        <Limb x1={90} y1={84} x2={86} y2={102} w={12}/>
        {/* Shins */}
        <g className="ht-sl"><Limb x1={64} y1={102} x2={60} y2={108} w={10}/></g>
        <g className="ht-sr"><Limb x1={86} y1={102} x2={82} y2={108} w={10}/></g>
        {/* Feet */}
        <ellipse cx="60" cy="108" rx="11" ry="4" fill={C}/>
        <ellipse cx="82" cy="108" rx="11" ry="4" fill={C}/>
      </g>

      {/* Motion arc */}
      <Arc d="M79,100 Q100,55 120,78" opacity={0.4}/>
      <text x="126" y="60" fontSize="9" fill={P} fontWeight="700">↑</text>
    </svg>
  )
}

// ── HINGE (RDL) ────────────────────────────────────────────────────────────
function HingeAnim() {
  return (
    <svg viewBox="0 0 130 150" className="w-full h-full">
      <style>{`
        @keyframes hi-torso { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(58deg)} }
        @keyframes hi-arm { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(50deg)} }
        @keyframes hi-head { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(45deg)} }
        .hi-torso{animation:hi-torso 2.6s ease-in-out infinite;transform-origin:65px 82px}
        .hi-arm-l{animation:hi-arm 2.6s ease-in-out infinite;transform-origin:55px 60px}
        .hi-arm-r{animation:hi-arm 2.6s ease-in-out infinite;transform-origin:75px 60px}
        .hi-head{animation:hi-head 2.6s ease-in-out infinite;transform-origin:65px 82px}
      `}</style>

      {/* Ground */}
      <rect x="10" y="136" width="110" height="3" rx="1.5" fill={PL}/>
      {/* Feet */}
      <ellipse cx="52" cy="136" rx="11" ry="4" fill={C}/>
      <ellipse cx="78" cy="136" rx="11" ry="4" fill={C}/>
      {/* Static legs (slight knee bend) */}
      <Limb x1={52} y1={82} x2={50} y2={118} w={12}/>
      <Limb x1={78} y1={82} x2={76} y2={118} w={12}/>
      <Limb x1={50} y1={118} x2={52} y2={136} w={10}/>
      <Limb x1={76} y1={118} x2={78} y2={136} w={10}/>

      {/* Hamstring / glute highlight */}
      <Muscle d="M48,82 Q65,78 82,82 Q80,112 65,114 Q50,112 48,82Z"/>

      {/* Torso + head (hinge forward) */}
      <g className="hi-head">
        <Head cx={65} cy={32} r={10}/>
        <Limb x1={65} y1={42} x2={65} y2={50} w={7}/>
      </g>
      <g className="hi-torso">
        <Limb x1={65} y1={50} x2={65} y2={82} w={13}/>
        {/* Arms */}
        <g className="hi-arm-l">
          <Limb x1={55} y1={60} x2={34} y2={80} w={8}/>
          <DB x={24} y={88} angle={-30}/>
        </g>
        <g className="hi-arm-r">
          <Limb x1={75} y1={60} x2={96} y2={80} w={8}/>
          <DB x={106} y={88} angle={30}/>
        </g>
      </g>

      {/* Arc showing hip hinge path */}
      <Arc d="M65,82 Q95,60 96,40" opacity={0.35}/>
    </svg>
  )
}

// ── LAT PULLDOWN ───────────────────────────────────────────────────────────
function PullVerticalAnim() {
  return (
    <svg viewBox="0 0 130 155" className="w-full h-full">
      <style>{`
        @keyframes lp-bar { 0%,100%{transform:translateY(0)} 45%{transform:translateY(26px)} }
        @keyframes lp-arm-l { 0%,100%{transform:rotate(-38deg)} 45%{transform:rotate(-12deg)} }
        @keyframes lp-arm-r { 0%,100%{transform:rotate(38deg)} 45%{transform:rotate(12deg)} }
        @keyframes lp-forearm-l { 0%,100%{transform:rotate(12deg)} 45%{transform:rotate(-6deg)} }
        @keyframes lp-forearm-r { 0%,100%{transform:rotate(-12deg)} 45%{transform:rotate(6deg)} }
        .lp-bar{animation:lp-bar 2.4s ease-in-out infinite}
        .lp-al{animation:lp-arm-l 2.4s ease-in-out infinite;transform-origin:50px 65px}
        .lp-ar{animation:lp-arm-r 2.4s ease-in-out infinite;transform-origin:80px 65px}
        .lp-fl{animation:lp-forearm-l 2.4s ease-in-out infinite;transform-origin:34px 86px}
        .lp-fr{animation:lp-forearm-r 2.4s ease-in-out infinite;transform-origin:96px 86px}
      `}</style>

      {/* Cable machine */}
      <rect x="20" y="8" width="90" height="9" rx="4.5" fill={PD}/>
      <circle cx="65" cy="12" r="5" fill={P}/>
      <line x1="65" y1="17" x2="65" y2="32" stroke={P} strokeWidth="2" strokeDasharray="3 2"/>

      {/* Seat */}
      <rect x="34" y="116" width="62" height="11" rx="5" fill={PL} stroke={P} strokeWidth="1.5"/>
      <Limb x1={50} y1={127} x2={50} y2={148} w={8} color="#e5e7eb"/>
      <Limb x1={80} y1={127} x2={80} y2={148} w={8} color="#e5e7eb"/>

      {/* Body (static seated) */}
      <Head cx={65} cy={52} r={10}/>
      <Limb x1={65} y1={62} x2={65} y2={65} w={7}/>
      <Limb x1={65} y1={65} x2={65} y2={116} w={13}/>
      {/* Seated legs */}
      <Limb x1={50} y1={116} x2={38} y2={127} w={10}/>
      <Limb x1={80} y1={116} x2={92} y2={127} w={10}/>

      {/* Lat highlight */}
      <Muscle d="M52,66 Q40,90 46,110 Q58,118 65,116 Q72,118 84,110 Q90,90 78,66 Q70,62 65,63 Q60,62 52,66Z"/>

      {/* Pulldown bar */}
      <g className="lp-bar">
        <rect x="30" y="30" width="70" height="7" rx="3.5" fill={PD}/>
        <circle cx="32" cy="33" r="5" fill={P} opacity="0.8"/>
        <circle cx="98" cy="33" r="5" fill={P} opacity="0.8"/>
        {/* Arms */}
        <g className="lp-al">
          <Limb x1={50} y1={65} x2={34} y2={86} w={8}/>
          <g className="lp-fl"><Limb x1={34} y1={86} x2={32} y2={36} w={7}/></g>
        </g>
        <g className="lp-ar">
          <Limb x1={80} y1={65} x2={96} y2={86} w={8}/>
          <g className="lp-fr"><Limb x1={96} y1={86} x2={98} y2={36} w={7}/></g>
        </g>
      </g>

      <Arc d="M32,33 Q65,80 98,33" opacity={0.25}/>
    </svg>
  )
}

// ── CABLE ROW ──────────────────────────────────────────────────────────────
function PullHorizontalAnim() {
  return (
    <svg viewBox="0 0 155 130" className="w-full h-full">
      <style>{`
        @keyframes cr-arm { 0%,100%{transform:translateX(-22px)} 45%{transform:translateX(4px)} }
        @keyframes cr-cable { 0%,100%{transform:scaleX(1)} 45%{transform:scaleX(0.72)} }
        @keyframes cr-torso { 0%,100%{transform:rotate(-6deg)} 45%{transform:rotate(4deg)} }
        .cr-arm{animation:cr-arm 2.4s ease-in-out infinite}
        .cr-cable{animation:cr-cable 2.4s ease-in-out infinite;transform-origin:18px 68px}
        .cr-torso{animation:cr-torso 2.4s ease-in-out infinite;transform-origin:100px 72px}
      `}</style>

      {/* Cable machine */}
      <rect x="6" y="30" width="16" height="84" rx="6" fill={PL} stroke={P} strokeWidth="1.5"/>
      <circle cx="14" cy="68" r="7" fill={PD}/>

      {/* Ground */}
      <rect x="6" y="114" width="143" height="3" rx="1.5" fill={PL}/>
      {/* Seat */}
      <rect x="88" y="96" width="58" height="11" rx="5" fill={PL} stroke={P} strokeWidth="1.5"/>

      {/* Cable */}
      <g className="cr-cable">
        <line x1="21" y1="68" x2="94" y2="68" stroke={P} strokeWidth="2.5" strokeLinecap="round"/>
      </g>

      {/* Body */}
      <g className="cr-torso">
        <Head cx={108} cy={56} r={10}/>
        <Limb x1={108} y1={66} x2={108} y2={96} w={13}/>
        {/* Seated legs */}
        <Limb x1={96} y1={96} x2={88} y2={107} w={10}/>
        <Limb x1={120} y1={96} x2={128} y2={107} w={10}/>
        {/* Back / rhomboid highlight */}
        <Muscle d="M100,67 Q88,72 86,84 Q96,95 108,96 Q120,95 130,84 Q128,72 116,67 Q112,65 108,66 Q104,65 100,67Z"/>
      </g>

      {/* Arms pulling */}
      <g className="cr-arm">
        <Limb x1={100} y1={72} x2={72} y2={70} w={8}/>
        <Limb x1={72} y1={70} x2={50} y2={68} w={7}/>
        {/* Handle */}
        <rect x="36" y="63" width="16} " height="10" rx="4" fill={PD} opacity="0.8"/>
        <rect x="36" y="63" width="16" height="10" rx="4" fill={PD} opacity="0.8"/>
      </g>

      <Arc d="M46,68 Q70,48 94,68" opacity={0.3}/>
    </svg>
  )
}

// ── PUSH CHEST ─────────────────────────────────────────────────────────────
function PushChestAnim() {
  return (
    <svg viewBox="0 0 140 140" className="w-full h-full">
      <style>{`
        @keyframes pc-arm { 0%,100%{transform:rotate(28deg)} 45%{transform:rotate(0deg)} }
        @keyframes pc-db { 0%,100%{transform:translateY(0) translateX(0)} 45%{transform:translateY(-22px) translateX(2px)} }
        .pc-al{animation:pc-arm 2.4s ease-in-out infinite;transform-origin:46px 74px}
        .pc-ar{animation:pc-arm 2.4s ease-in-out infinite;transform-origin:94px 74px;animation-direction:reverse}
        .pc-dbl{animation:pc-db 2.4s ease-in-out infinite}
        .pc-dbr{animation:pc-db 2.4s ease-in-out infinite}
      `}</style>

      {/* Bench */}
      <rect x="20" y="90" width="100" height="14" rx="7" fill={PL} stroke={P} strokeWidth="1.5"/>
      <Limb x1={34} y1={104} x2={34} y2={128} w={8} color="#e5e7eb"/>
      <Limb x1={106} y1={104} x2={106} y2={128} w={8} color="#e5e7eb"/>
      {/* Ground */}
      <rect x="10" y="128" width="120" height="3" rx="1.5" fill={PL}/>

      {/* Body lying */}
      <Head cx={70} cy={78} r={10}/>
      <Limb x1={70} y1={88} x2={70} y2={90} w={7}/>
      <Limb x1={46} y1={90} x2={94} y2={90} w={13}/>

      {/* Chest highlight */}
      <Muscle d="M46,88 Q70,80 94,88 Q90,100 70,102 Q50,100 46,88Z"/>

      {/* Left arm + DB */}
      <g className="pc-al">
        <Limb x1={46} y1={74} x2={26} y2={78} w={8}/>
        <g className="pc-dbl"><DB x={18} y={68} angle={-15}/></g>
      </g>
      {/* Right arm + DB */}
      <g className="pc-ar">
        <Limb x1={94} y1={74} x2={114} y2={78} w={8}/>
        <g className="pc-dbr"><DB x={122} y={68} angle={15}/></g>
      </g>

      {/* Up arrows */}
      <text x="18" y="50" fontSize="11" fill={P} fontWeight="800" opacity="0.7">↑</text>
      <text x="118" y="50" fontSize="11" fill={P} fontWeight="800" opacity="0.7">↑</text>
    </svg>
  )
}

// ── PUSH SHOULDER ──────────────────────────────────────────────────────────
function PushShoulderAnim() {
  return (
    <svg viewBox="0 0 130 155" className="w-full h-full">
      <style>{`
        @keyframes ps-arm { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-36deg)} }
        @keyframes ps-fore { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-18deg)} }
        @keyframes ps-db { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-30px)} }
        .ps-al{animation:ps-arm 2.4s ease-in-out infinite;transform-origin:40px 68px}
        .ps-ar{animation:ps-arm 2.4s ease-in-out infinite;transform-origin:90px 68px;animation-direction:reverse}
        .ps-fl{animation:ps-fore 2.4s ease-in-out infinite;transform-origin:30px 88px}
        .ps-fr{animation:ps-fore 2.4s ease-in-out infinite;transform-origin:100px 88px;animation-direction:reverse}
        .ps-db{animation:ps-db 2.4s ease-in-out infinite}
      `}</style>

      {/* Seat */}
      <rect x="34" y="118" width="62" height="11" rx="5" fill={PL} stroke={P} strokeWidth="1.5"/>
      <Limb x1={48} y1={129} x2={48} y2={148} w={8} color="#e5e7eb"/>
      <Limb x1={82} y1={129} x2={82} y2={148} w={8} color="#e5e7eb"/>

      {/* Body */}
      <Head cx={65} cy={44} r={10}/>
      <Limb x1={65} y1={54} x2={65} y2={58} w={7}/>
      <Limb x1={65} y1={58} x2={65} y2={118} w={13}/>
      <Limb x1={48} y1={118} x2={40} y2={130} w={10}/>
      <Limb x1={82} y1={118} x2={90} y2={130} w={10}/>

      {/* Shoulder highlight */}
      <Muscle d="M40,64 Q65,55 90,64 Q88,74 65,76 Q42,74 40,64Z"/>

      {/* Arms */}
      <g className="ps-al">
        <Limb x1={40} y1={68} x2={30} y2={88} w={8}/>
        <g className="ps-fl">
          <Limb x1={30} y1={88} x2={28} y2={106} w={7}/>
        </g>
      </g>
      <g className="ps-ar">
        <Limb x1={90} y1={68} x2={100} y2={88} w={8}/>
        <g className="ps-fr">
          <Limb x1={100} y1={88} x2={102} y2={106} w={7}/>
        </g>
      </g>
      <g className="ps-db">
        <DB x={28} y={112} angle={-5}/>
        <DB x={102} y={112} angle={5}/>
      </g>

      <Arc d="M28,105 Q65,30 102,105" opacity={0.25}/>
    </svg>
  )
}

// ── LATERAL RAISE ──────────────────────────────────────────────────────────
function LateralRaiseAnim() {
  return (
    <svg viewBox="0 0 145 155" className="w-full h-full">
      <style>{`
        @keyframes lr-arm { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-62deg)} }
        @keyframes lr-fore { 0%,100%{transform:rotate(10deg)} 45%{transform:rotate(-10deg)} }
        .lr-al{animation:lr-arm 2.4s ease-in-out infinite;transform-origin:54px 72px}
        .lr-ar{animation:lr-arm 2.4s ease-in-out infinite;transform-origin:91px 72px;animation-direction:reverse}
        .lr-fl{animation:lr-fore 2.4s ease-in-out infinite;transform-origin:38px 90px}
        .lr-fr{animation:lr-fore 2.4s ease-in-out infinite;transform-origin:107px 90px;animation-direction:reverse}
      `}</style>

      {/* Ground */}
      <rect x="10" y="140" width="125" height="3" rx="1.5" fill={PL}/>
      {/* Feet */}
      <ellipse cx="62" cy="140" rx="11" ry="4" fill={C}/>
      <ellipse cx="83" cy="140" rx="11" ry="4" fill={C}/>

      {/* Body */}
      <Head cx={72} cy={38} r={10}/>
      <Limb x1={72} y1={48} x2={72} y2={54} w={7}/>
      <Limb x1={72} y1={54} x2={72} y2={106} w={13}/>
      <Limb x1={58} y1={106} x2={55} y2={125} w={11}/>
      <Limb x1={86} y1={106} x2={89} y2={125} w={11}/>
      <Limb x1={55} y1={125} x2={62} y2={140} w={10}/>
      <Limb x1={89} y1={125} x2={83} y2={140} w={10}/>

      {/* Shoulder / lateral delt highlight */}
      <Muscle d="M50,62 Q72,52 94,62 Q92,76 72,78 Q52,76 50,62Z"/>

      {/* Arms */}
      <g className="lr-al">
        <Limb x1={54} y1={72} x2={38} y2={90} w={8}/>
        <g className="lr-fl">
          <Limb x1={38} y1={90} x2={32} y2={104} w={7}/>
          <DB x={22} y={112} angle={-30}/>
        </g>
      </g>
      <g className="lr-ar">
        <Limb x1={91} y1={72} x2={107} y2={90} w={8}/>
        <g className="lr-fr">
          <Limb x1={107} y1={90} x2={113} y2={104} w={7}/>
          <DB x={123} y={112} angle={30}/>
        </g>
      </g>

      {/* Motion arcs */}
      <Arc d="M22,110 Q36,60 72,52" opacity={0.3}/>
      <Arc d="M123,110 Q109,60 72,52" opacity={0.3}/>
    </svg>
  )
}

// ── BICEP CURL ─────────────────────────────────────────────────────────────
function CurlAnim() {
  return (
    <svg viewBox="0 0 130 155" className="w-full h-full">
      <style>{`
        @keyframes cu-fl { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-112deg)} }
        @keyframes cu-fr { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(112deg)} }
        .cu-fl{animation:cu-fl 2.4s ease-in-out infinite;transform-origin:42px 96px}
        .cu-fr{animation:cu-fr 2.4s ease-in-out infinite;transform-origin:88px 96px}
      `}</style>

      {/* Ground */}
      <rect x="10" y="140" width="110" height="3" rx="1.5" fill={PL}/>
      <ellipse cx="54" cy="140" rx="11" ry="4" fill={C}/>
      <ellipse cx="76" cy="140" rx="11" ry="4" fill={C}/>

      {/* Body */}
      <Head cx={65} cy={38} r={10}/>
      <Limb x1={65} y1={48} x2={65} y2={54} w={7}/>
      <Limb x1={65} y1={54} x2={65} y2={106} w={13}/>
      <Limb x1={54} y1={106} x2={52} y2={126} w={11}/>
      <Limb x1={76} y1={106} x2={78} y2={126} w={11}/>
      <Limb x1={52} y1={126} x2={54} y2={140} w={10}/>
      <Limb x1={78} y1={126} x2={76} y2={140} w={10}/>

      {/* Upper arms (static, tucked in) */}
      <Limb x1={42} y1={66} x2={42} y2={96} w={9}/>
      <Limb x1={88} y1={66} x2={88} y2={96} w={9}/>

      {/* Bicep highlight */}
      <Muscle d="M34,66 Q42,58 50,66 Q50,85 42,88 Q34,85 34,66Z"/>
      <Muscle d="M80,66 Q88,58 96,66 Q96,85 88,88 Q80,85 80,66Z"/>

      {/* Forearms curling */}
      <g className="cu-fl">
        <Limb x1={42} y1={96} x2={42} y2={124} w={8}/>
        <DB x={42} y={130} angle={0}/>
      </g>
      <g className="cu-fr">
        <Limb x1={88} y1={96} x2={88} y2={124} w={8}/>
        <DB x={88} y={130} angle={0}/>
      </g>

      <Arc d="M28,126 Q42,60 56,90" opacity={0.3}/>
      <Arc d="M102,126 Q88,60 74,90" opacity={0.3}/>
    </svg>
  )
}

// ── TRICEP PUSHDOWN ────────────────────────────────────────────────────────
function TricepAnim() {
  return (
    <svg viewBox="0 0 130 155" className="w-full h-full">
      <style>{`
        @keyframes tr-fl { 0%,100%{transform:rotate(-90deg)} 45%{transform:rotate(0deg)} }
        @keyframes tr-fr { 0%,100%{transform:rotate(90deg)} 45%{transform:rotate(0deg)} }
        @keyframes tr-cable { 0%,100%{transform:scaleY(0.7)} 45%{transform:scaleY(1)} }
        .tr-fl{animation:tr-fl 2.4s ease-in-out infinite;transform-origin:42px 84px}
        .tr-fr{animation:tr-fr 2.4s ease-in-out infinite;transform-origin:88px 84px}
        .tr-cable{animation:tr-cable 2.4s ease-in-out infinite;transform-origin:65px 14px}
      `}</style>

      {/* Cable machine top */}
      <rect x="42" y="8" width="46" height="8" rx="4" fill={PD}/>
      <g className="tr-cable">
        <line x1="42" y1="16" x2="42" y2="62" stroke={P} strokeWidth="2" strokeDasharray="3 2"/>
        <line x1="88" y1="16" x2="88" y2="62" stroke={P} strokeWidth="2" strokeDasharray="3 2"/>
      </g>
      {/* Handle bar */}
      <rect x="36" y="60" width="58" height="7" rx="3.5" fill={PD}/>

      {/* Ground */}
      <rect x="10" y="140" width="110" height="3" rx="1.5" fill={PL}/>
      <ellipse cx="54" cy="140" rx="11" ry="4" fill={C}/>
      <ellipse cx="76" cy="140" rx="11" ry="4" fill={C}/>

      {/* Body */}
      <Head cx={65} cy={36} r={10}/>
      <Limb x1={65} y1={46} x2={65} y2={52} w={7}/>
      <Limb x1={65} y1={52} x2={65} y2={106} w={13}/>
      <Limb x1={54} y1={106} x2={52} y2={126} w={11}/>
      <Limb x1={76} y1={106} x2={78} y2={126} w={11}/>
      <Limb x1={52} y1={126} x2={54} y2={140} w={10}/>
      <Limb x1={78} y1={126} x2={76} y2={140} w={10}/>

      {/* Upper arms (static, elbows tucked) */}
      <Limb x1={42} y1={60} x2={42} y2={84} w={9}/>
      <Limb x1={88} y1={60} x2={88} y2={84} w={9}/>

      {/* Tricep highlight */}
      <Muscle d="M34,58 Q42,50 50,58 Q52,76 42,80 Q32,76 34,58Z"/>
      <Muscle d="M80,58 Q88,50 96,58 Q98,76 88,80 Q78,76 80,58Z"/>

      {/* Forearms extending down */}
      <g className="tr-fl">
        <Limb x1={42} y1={84} x2={42} y2={110} w={8}/>
      </g>
      <g className="tr-fr">
        <Limb x1={88} y1={84} x2={88} y2={110} w={8}/>
      </g>

      <Arc d="M36,110 Q42,76 42,62" opacity={0.35}/>
      <Arc d="M94,110 Q88,76 88,62" opacity={0.35}/>
    </svg>
  )
}

// ── CABLE KICKBACK ─────────────────────────────────────────────────────────
function KickbackAnim() {
  return (
    <svg viewBox="0 0 155 130" className="w-full h-full">
      <style>{`
        @keyframes kb-thigh { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-38deg)} }
        @keyframes kb-shin { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(28deg)} }
        @keyframes kb-cable { 0%,100%{transform:scaleX(1)} 45%{transform:scaleX(0.78)} }
        .kb-thigh{animation:kb-thigh 2.4s ease-in-out infinite;transform-origin:96px 72px}
        .kb-shin{animation:kb-shin 2.4s ease-in-out infinite;transform-origin:90px 96px}
        .kb-cable{animation:kb-cable 2.4s ease-in-out infinite;transform-origin:14px 70px}
      `}</style>

      {/* Cable machine */}
      <rect x="6" y="34" width="14" height="76" rx="5" fill={PL} stroke={P} strokeWidth="1.5"/>
      <circle cx="13" cy="70" r="6" fill={PD}/>

      {/* Support bench */}
      <rect x="38" y="72" width="52" height="10" rx="4" fill={PL} stroke={P} strokeWidth="1.5"/>

      {/* Cable */}
      <g className="kb-cable">
        <line x1="19" y1="70" x2="68" y2="70" stroke={P} strokeWidth="2.5" strokeLinecap="round"/>
      </g>

      {/* Ground */}
      <rect x="6" y="114" width="143" height="3" rx="1.5" fill={PL}/>

      {/* Body leaning on bench */}
      <Head cx={62} cy={56} r={9}/>
      <Limb x1={62} y1={65} x2={80} y2={72} w={12}/>
      {/* Support arms */}
      <Limb x1={50} y1={72} x2={38} y2={82} w={7}/>
      <Limb x1={80} y1={72} x2={90} y2={82} w={7}/>

      {/* Standing leg */}
      <Limb x1={80} y1={82} x2={78} y2={114} w={11}/>
      <ellipse cx="78" cy="114" rx="11" ry="4" fill={C}/>

      {/* Glute highlight */}
      <Muscle d="M84,68 Q100,62 112,70 Q110,82 96,84 Q82,82 84,68Z"/>

      {/* Kicking leg (upper + lower) */}
      <g className="kb-thigh">
        <Limb x1={96} y1={72} x2={90} y2={96} w={11}/>
        <g className="kb-shin">
          <Limb x1={90} y1={96} x2={84} y2={114} w={9}/>
          {/* Ankle strap */}
          <rect x="76" y="108" width="16" height="8" rx="4" fill={P} opacity="0.8"/>
        </g>
      </g>

      <Arc d="M84,114 Q120,80 130,58" opacity={0.35}/>
      <text x="128" y="52" fontSize="9" fill={P} fontWeight="700">↑ Squeeze</text>
    </svg>
  )
}

// ── PLANK ──────────────────────────────────────────────────────────────────
function PlankAnim() {
  return (
    <svg viewBox="0 0 170 100" className="w-full h-full">
      <style>{`
        @keyframes pl-breathe { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.04)} }
        @keyframes pl-core { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        @keyframes pl-glow { 0%,100%{r:18;opacity:0.15} 50%{r:24;opacity:0.3} }
        .pl-body{animation:pl-breathe 3.5s ease-in-out infinite;transform-origin:85px 56px}
        .pl-core{animation:pl-core 3.5s ease-in-out infinite}
        .pl-glow{animation:pl-glow 3.5s ease-in-out infinite}
      `}</style>

      {/* Ground */}
      <rect x="10" y="80" width="150" height="3" rx="1.5" fill={PL}/>

      {/* Forearms */}
      <Limb x1={28} y1={72} x2={54} y2={72} w={8}/>
      <Limb x1={28} y1={72} x2={28} y2={80} w={8}/>
      <Limb x1={54} y1={72} x2={54} y2={80} w={8}/>

      <g className="pl-body">
        {/* Head */}
        <Head cx={22} cy={60} r={10}/>
        {/* Body straight line */}
        <Limb x1={32} y1={60} x2={152} y2={60} w={14}/>
        {/* Toes */}
        <Limb x1={152} y1={60} x2={158} y2={80} w={8}/>
        <ellipse cx="158" cy="80" rx="9" ry="4" fill={C}/>

        {/* Core glow */}
        <circle cx="85" cy="60" r="18" fill={PLB} className="pl-glow"/>
        {/* Core highlight band */}
        <rect x="64" y="51" width="42" height="18" rx="8" fill={PL} stroke={P} strokeWidth="2" className="pl-core"/>
      </g>

      <text x="85" y="22" textAnchor="middle" fontSize="9" fill={P} fontWeight="700">◆ Core braced</text>
      <Arc d="M32,60 Q85,44 152,60" opacity={0.2}/>
    </svg>
  )
}

// ── DEAD BUG ───────────────────────────────────────────────────────────────
function DeadBugAnim() {
  return (
    <svg viewBox="0 0 165 135" className="w-full h-full">
      <style>{`
        @keyframes db-arm-l { 0%,25%{transform:rotate(0deg)} 40%,60%{transform:rotate(-75deg)} 75%,100%{transform:rotate(0deg)} }
        @keyframes db-leg-r { 0%,25%{transform:rotate(0deg)} 40%,60%{transform:rotate(65deg)} 75%,100%{transform:rotate(0deg)} }
        @keyframes db-arm-r { 0%,50%{transform:rotate(0deg)} 65%,85%{transform:rotate(75deg)} 100%{transform:rotate(0deg)} }
        @keyframes db-leg-l { 0%,50%{transform:rotate(0deg)} 65%,85%{transform:rotate(-65deg)} 100%{transform:rotate(0deg)} }
        @keyframes db-core { 0%,100%{opacity:0.5} 40%,60%{opacity:1} }
        .db-al{animation:db-arm-l 4s ease-in-out infinite;transform-origin:74px 52px}
        .db-lr{animation:db-leg-r 4s ease-in-out infinite;transform-origin:94px 82px}
        .db-ar{animation:db-arm-r 4s ease-in-out infinite;transform-origin:96px 52px}
        .db-ll{animation:db-leg-l 4s ease-in-out infinite;transform-origin:76px 82px}
        .db-core{animation:db-core 4s ease-in-out infinite}
      `}</style>

      {/* Floor */}
      <rect x="10" y="122" width="145" height="3" rx="1.5" fill={PL}/>

      {/* Head */}
      <Head cx={85} cy={26} r={11}/>
      {/* Torso (flat) */}
      <Limb x1={85} y1={37} x2={85} y2={90} w={14}/>

      {/* Core highlight */}
      <rect x="72" y="48" width="26" height="34" rx="10" fill={PL} stroke={P} strokeWidth="2" className="db-core"/>

      {/* Left arm (animates phase 1) */}
      <g className="db-al">
        <Limb x1={74} y1={52} x2={46} y2={52} w={8}/>
        <Limb x1={46} y1={52} x2={22} y2={52} w={7}/>
        <circle cx="16" cy="52" r="5" fill={P} opacity="0.7"/>
      </g>

      {/* Right leg (animates phase 1) */}
      <g className="db-lr">
        <Limb x1={94} y1={82} x2={118} y2={90} w={10}/>
        <Limb x1={118} y1={90} x2={140} y2={92} w={8}/>
        <ellipse cx="148" cy="93" rx="9" ry="5" fill={C}/>
      </g>

      {/* Right arm (animates phase 2) */}
      <g className="db-ar">
        <Limb x1={96} y1={52} x2={124} y2={52} w={8}/>
        <Limb x1={124} y1={52} x2={148} y2={52} w={7}/>
        <circle cx="154" cy="52" r="5" fill={P} opacity="0.7"/>
      </g>

      {/* Left leg (animates phase 2) */}
      <g className="db-ll">
        <Limb x1={76} y1={82} x2={52} y2={90} w={10}/>
        <Limb x1={52} y1={90} x2={30} y2={92} w={8}/>
        <ellipse cx="22" cy="93" rx="9" ry="5" fill={C}/>
      </g>

      <text x="85" y="14" textAnchor="middle" fontSize="8.5" fill={P} fontWeight="700">Opposite arm + leg · back stays flat</text>
    </svg>
  )
}

// ── GENERIC ────────────────────────────────────────────────────────────────
function GenericAnim() {
  return (
    <svg viewBox="0 0 120 150" className="w-full h-full">
      <style>{`
        @keyframes gn-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .gn-b{animation:gn-pulse 2s ease-in-out infinite;transform-origin:60px 75px}
      `}</style>
      <rect x="15" y="136" width="90" height="3" rx="1.5" fill={PL}/>
      <g className="gn-b">
        <Head cx={60} cy={30} r={11}/>
        <Limb x1={60} y1={41} x2={60} y2={48} w={7}/>
        <Limb x1={60} y1={48} x2={60} y2={100} w={13}/>
        <Limb x1={34} y1={56} x2={86} y2={56} w={9}/>
        <Limb x1={34} y1={56} x2={22} y2={80} w={8}/>
        <Limb x1={86} y1={56} x2={98} y2={80} w={8}/>
        <Limb x1={50} y1={100} x2={46} y2={124} w={10}/>
        <Limb x1={70} y1={100} x2={74} y2={124} w={10}/>
        <Limb x1={46} y1={124} x2={50} y2={136} w={9}/>
        <Limb x1={74} y1={124} x2={70} y2={136} w={9}/>
        <ellipse cx="50" cy="136" rx="10" ry="4" fill={C}/>
        <ellipse cx="70" cy="136" rx="10" ry="4" fill={C}/>
        <Muscle d="M46,48 Q60,42 74,48 Q72,62 60,64 Q48,62 46,48Z"/>
      </g>
    </svg>
  )
}

const ANIMS: Record<AnimationType, () => JSX.Element> = {
  squat:           SquatAnim,
  hip_thrust:      HipThrustAnim,
  hinge:           HingeAnim,
  pull_vertical:   PullVerticalAnim,
  pull_horizontal: PullHorizontalAnim,
  push_chest:      PushChestAnim,
  push_shoulder:   PushShoulderAnim,
  lateral_raise:   LateralRaiseAnim,
  curl:            CurlAnim,
  tricep:          TricepAnim,
  kickback:        KickbackAnim,
  core_plank:      PlankAnim,
  core_dead_bug:   DeadBugAnim,
  generic:         GenericAnim,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ExerciseAnimation({ name, compact }: { name: string; compact?: boolean }) {
  const type = getAnimationType(name)
  const Anim = ANIMS[type]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#FDF2F8,#fff)' }}>
      <div className="w-full h-[160px] mx-auto flex items-center justify-center px-4 pt-3">
        <Anim />
      </div>
      <div className="px-4 pb-3 pt-1 text-center">
        <p className="text-[11px] font-semibold text-pink-500 leading-snug">{TIPS[type]}</p>
      </div>
    </div>
  )
}
