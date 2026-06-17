'use client'

type AnimationType =
  | 'squat'
  | 'hip_thrust'
  | 'hinge'
  | 'pull_vertical'
  | 'pull_horizontal'
  | 'push'
  | 'lateral_raise'
  | 'curl'
  | 'tricep'
  | 'kickback'
  | 'core_plank'
  | 'core_dead_bug'
  | 'generic'

const EXERCISE_MAP: [RegExp, AnimationType][] = [
  [/squat|leg press|lunge/i, 'squat'],
  [/hip thrust|glute bridge/i, 'hip_thrust'],
  [/romanian|rdl|deadlift|good morning/i, 'hinge'],
  [/lat pull|pulldown|pull.up|chin.up/i, 'pull_vertical'],
  [/row|seated row|cable row/i, 'pull_horizontal'],
  [/chest press|bench|push.up|chest fly/i, 'push'],
  [/shoulder press|overhead|ohp|military/i, 'push'],
  [/lateral raise|side raise/i, 'lateral_raise'],
  [/bicep|curl(?!.*(tri|kick))/i, 'curl'],
  [/tricep|pushdown|skull/i, 'tricep'],
  [/kickback/i, 'kickback'],
  [/plank|hollow/i, 'core_plank'],
  [/dead bug|pallof|bird.dog/i, 'core_dead_bug'],
]

function getAnimationType(name: string): AnimationType {
  for (const [pattern, type] of EXERCISE_MAP) {
    if (pattern.test(name)) return type
  }
  return 'generic'
}

function getLabel(type: AnimationType): string {
  const labels: Record<AnimationType, string> = {
    squat: 'Drive through heels, chest up',
    hip_thrust: 'Squeeze glutes at the top',
    hinge: 'Hinge at hips, soft knee bend',
    pull_vertical: 'Pull to collarbone, lead with elbows',
    pull_horizontal: 'Retract shoulder blades, squeeze',
    push: 'Full extension, controlled descent',
    lateral_raise: 'Slight forward lean, lead with elbows',
    curl: 'Keep upper arm still, slow eccentric',
    tricep: 'Elbows tucked, extend fully',
    kickback: 'Upper arm parallel to floor, squeeze',
    core_plank: 'Straight line, breathe steadily',
    core_dead_bug: 'Lower back pressed down the whole time',
    generic: 'Controlled movement, full range',
  }
  return labels[type]
}

// ─── SVG Animations ────────────────────────────────────────────────────────────

const PINK = '#F472B6'
const PINK_DARK = '#DB2777'
const PINK_LIGHT = '#FBCFE8'
const BODY = '#1F2937'

function SquatAnim() {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full">
      <style>{`
        @keyframes squat-body {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(22px); }
        }
        @keyframes squat-knee-l {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(50deg); }
        }
        @keyframes squat-knee-r {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-50deg); }
        }
        @keyframes squat-arm {
          0%,100% { transform: rotate(-10deg); }
          50% { transform: rotate(-30deg); }
        }
        .sq-body { animation: squat-body 2s ease-in-out infinite; transform-origin: 60px 70px; }
        .sq-leg-l { animation: squat-knee-l 2s ease-in-out infinite; transform-origin: 50px 90px; }
        .sq-leg-r { animation: squat-knee-r 2s ease-in-out infinite; transform-origin: 70px 90px; }
        .sq-arm { animation: squat-arm 2s ease-in-out infinite; transform-origin: 60px 65px; }
      `}</style>
      {/* Ground */}
      <rect x="10" y="128" width="100" height="4" rx="2" fill={PINK_LIGHT} />
      {/* Bar across shoulders */}
      <rect x="15" y="52" width="90" height="6" rx="3" fill={PINK_DARK} />
      <circle cx="18" cy="55" r="8" fill="none" stroke={PINK} strokeWidth="3" />
      <circle cx="102" cy="55" r="8" fill="none" stroke={PINK} strokeWidth="3" />

      <g className="sq-body">
        {/* Head */}
        <circle cx="60" cy="38" r="11" fill={BODY} />
        {/* Neck */}
        <rect x="57" y="48" width="6" height="6" rx="2" fill={BODY} />
        {/* Torso */}
        <rect x="44" y="54" width="32" height="36" rx="8" fill={BODY} />
        {/* Arms */}
        <g className="sq-arm">
          <rect x="20" y="54" width="26" height="7" rx="3.5" fill={BODY} />
          <rect x="74" y="54" width="26" height="7" rx="3.5" fill={BODY} />
        </g>
        {/* Upper legs */}
        <rect x="46" y="87" width="12" height="30" rx="6" fill={BODY} />
        <rect x="62" y="87" width="12" height="30" rx="6" fill={BODY} />
      </g>

      {/* Lower legs - separate so knee bends */}
      <g className="sq-leg-l">
        <rect x="46" y="112" width="12" height="22" rx="6" fill={BODY} />
        <ellipse cx="52" cy="132" rx="8" ry="4" fill={PINK} />
      </g>
      <g className="sq-leg-r">
        <rect x="62" y="112" width="12" height="22" rx="6" fill={BODY} />
        <ellipse cx="68" cy="132" rx="8" ry="4" fill={PINK} />
      </g>

      {/* Down arrow */}
      <text x="60" y="17" textAnchor="middle" fontSize="10" fill={PINK}>↕</text>
    </svg>
  )
}

function HipThrustAnim() {
  return (
    <svg viewBox="0 0 140 120" className="w-full h-full">
      <style>{`
        @keyframes thrust-hips {
          0%,100% { transform: translateY(12px) rotate(-8deg); }
          50% { transform: translateY(-4px) rotate(8deg); }
        }
        @keyframes thrust-torso {
          0%,100% { transform: rotate(-35deg); }
          50% { transform: rotate(-10deg); }
        }
        .ht-hips { animation: thrust-hips 2s ease-in-out infinite; transform-origin: 80px 85px; }
        .ht-torso { animation: thrust-torso 2s ease-in-out infinite; transform-origin: 55px 70px; }
      `}</style>
      {/* Bench */}
      <rect x="8" y="68" width="48" height="14" rx="6" fill={PINK_LIGHT} />
      <rect x="12" y="82" width="8" height="18" rx="3" fill={PINK_LIGHT} />
      <rect x="40" y="82" width="8" height="18" rx="3" fill={PINK_LIGHT} />
      {/* Ground */}
      <rect x="8" y="100" width="124" height="4" rx="2" fill={PINK_LIGHT} />
      {/* Head on bench */}
      <circle cx="30" cy="60" r="10" fill={BODY} />

      {/* Torso leaning on bench */}
      <g className="ht-torso">
        <rect x="38" y="56" width="34" height="28" rx="8" fill={BODY} />
      </g>

      {/* Hips + legs */}
      <g className="ht-hips">
        {/* Hips */}
        <rect x="62" y="72" width="38" height="18" rx="9" fill={BODY} />
        {/* Barbell across hips */}
        <rect x="50" y="75" width="62" height="8" rx="4" fill={PINK_DARK} />
        <circle cx="52" cy="79" r="7" fill="none" stroke={PINK} strokeWidth="3" />
        <circle cx="110" cy="79" r="7" fill="none" stroke={PINK} strokeWidth="3" />
        {/* Upper legs */}
        <rect x="64" y="88" width="14" height="18" rx="7" fill={BODY} />
        <rect x="82" y="88" width="14" height="18" rx="7" fill={BODY} />
        {/* Lower legs (feet on ground) */}
        <rect x="64" y="101" width="14" height="3" rx="2" fill={BODY} />
        <rect x="82" y="101" width="14" height="3" rx="2" fill={BODY} />
        <ellipse cx="71" cy="103" rx="9" ry="4" fill={PINK} />
        <ellipse cx="89" cy="103" rx="9" ry="4" fill={PINK} />
      </g>

      <text x="105" y="55" textAnchor="middle" fontSize="10" fill={PINK}>↑ Squeeze!</text>
    </svg>
  )
}

function HingeAnim() {
  return (
    <svg viewBox="0 0 130 140" className="w-full h-full">
      <style>{`
        @keyframes hinge-torso {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(55deg); }
        }
        @keyframes hinge-arm {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(28px); }
        }
        .h-torso { animation: hinge-torso 2.5s ease-in-out infinite; transform-origin: 65px 80px; }
        .h-arm { animation: hinge-arm 2.5s ease-in-out infinite; }
      `}</style>
      <rect x="10" y="128" width="110" height="4" rx="2" fill={PINK_LIGHT} />

      {/* Legs - static, slight bend */}
      <rect x="52" y="80" width="14" height="38" rx="7" fill={BODY} />
      <rect x="70" y="80" width="14" height="38" rx="7" fill={BODY} />
      <ellipse cx="59" cy="131" rx="9" ry="4" fill={PINK} />
      <ellipse cx="77" cy="131" rx="9" ry="4" fill={PINK} />

      {/* Torso + head that hinge */}
      <g className="h-torso">
        <circle cx="65" cy="34" r="12" fill={BODY} />
        <rect x="49" y="46" width="32" height="38" rx="10" fill={BODY} />
        {/* Arms with dumbbells */}
        <g className="h-arm">
          <rect x="36" y="66" width="14" height="10" rx="5" fill={BODY} />
          <rect x="86" y="66" width="14" height="10" rx="5" fill={BODY} />
          {/* DBs */}
          <rect x="28" y="67" width="10" height="8" rx="3" fill={PINK_DARK} />
          <rect x="98" y="67" width="10" height="8" rx="3" fill={PINK_DARK} />
        </g>
      </g>

      <text x="65" y="16" textAnchor="middle" fontSize="9" fill={PINK}>Hinge at hips ↷</text>
    </svg>
  )
}

function PullVerticalAnim() {
  return (
    <svg viewBox="0 0 130 150" className="w-full h-full">
      <style>{`
        @keyframes lp-arms {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(22px) rotate(8deg); }
        }
        @keyframes lp-body {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .lp-arms { animation: lp-arms 2s ease-in-out infinite; transform-origin: 65px 60px; }
        .lp-body { animation: lp-body 2s ease-in-out infinite; }
      `}</style>
      {/* Seat */}
      <rect x="30" y="110" width="70" height="10" rx="5" fill={PINK_LIGHT} />
      <rect x="50" y="120" width="10" height="18" rx="4" fill={PINK_LIGHT} />
      <rect x="70" y="120" width="10" height="18" rx="4" fill={PINK_LIGHT} />
      {/* Cable machine bar */}
      <rect x="20" y="10" width="90" height="8" rx="4" fill={PINK_DARK} />
      <line x1="65" y1="18" x2="65" y2="38" stroke={PINK} strokeWidth="2" strokeDasharray="3 2" />

      <g className="lp-body">
        {/* Head */}
        <circle cx="65" cy="58" r="11" fill={BODY} />
        {/* Torso */}
        <rect x="49" y="69" width="32" height="40" rx="10" fill={BODY} />
        {/* Legs sitting */}
        <rect x="36" y="103" width="14" height="10" rx="5" fill={BODY} />
        <rect x="80" y="103" width="14" height="10" rx="5" fill={BODY} />
        {/* Arms raising */}
        <g className="lp-arms">
          <rect x="20" y="42" width="32" height="10" rx="5" fill={BODY} />
          <rect x="78" y="42" width="32" height="10" rx="5" fill={BODY} />
          {/* Hands on bar */}
          <circle cx="22" cy="47" r="5" fill={PINK} />
          <circle cx="108" cy="47" r="5" fill={PINK} />
        </g>
      </g>

      <text x="65" y="148" textAnchor="middle" fontSize="9" fill={PINK}>Pull to collarbone</text>
    </svg>
  )
}

function PullHorizontalAnim() {
  return (
    <svg viewBox="0 0 150 130" className="w-full h-full">
      <style>{`
        @keyframes row-arms {
          0%,100% { transform: translateX(-18px); }
          50% { transform: translateX(6px); }
        }
        @keyframes row-cable {
          0%,100% { transform: scaleX(1); }
          50% { transform: scaleX(0.7); }
        }
        .row-arms { animation: row-arms 2s ease-in-out infinite; }
        .row-cable { animation: row-cable 2s ease-in-out infinite; transform-origin: 20px 65px; }
      `}</style>
      {/* Cable machine */}
      <rect x="10" y="30" width="16" height="90" rx="4" fill={PINK_LIGHT} />
      <circle cx="18" cy="65" r="6" fill={PINK_DARK} />

      {/* Seat + body */}
      <rect x="80" y="90" width="60" height="10" rx="4" fill={PINK_LIGHT} />
      <circle cx="100" cy="62" r="11" fill={BODY} />
      <rect x="84" y="73" width="32" height="22" rx="9" fill={BODY} />
      {/* Legs */}
      <rect x="84" y="90" width="14" height="16" rx="7" fill={BODY} />
      <rect x="102" y="90" width="14" height="16" rx="7" fill={BODY} />

      {/* Cable */}
      <g className="row-cable">
        <line x1="24" y1="65" x2="80" y2="65" stroke={PINK} strokeWidth="2" />
      </g>

      {/* Arms pulling */}
      <g className="row-arms">
        <rect x="58" y="58" width="30" height="10" rx="5" fill={BODY} />
        <rect x="50" y="63" width="14" height="8" rx="4" fill={PINK_DARK} />
      </g>

      <text x="100" y="120" textAnchor="middle" fontSize="9" fill={PINK}>Squeeze shoulder blades</text>
    </svg>
  )
}

function PushAnim() {
  return (
    <svg viewBox="0 0 130 150" className="w-full h-full">
      <style>{`
        @keyframes push-arms {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes push-db {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .push-arms { animation: push-arms 2s ease-in-out infinite; transform-origin: 65px 75px; }
        .push-db { animation: push-db 2s ease-in-out infinite; }
      `}</style>
      {/* Bench */}
      <rect x="20" y="100" width="90" height="12" rx="6" fill={PINK_LIGHT} />
      <rect x="28" y="112" width="10" height="20" rx="4" fill={PINK_LIGHT} />
      <rect x="92" y="112" width="10" height="20" rx="4" fill={PINK_LIGHT} />

      {/* Head */}
      <circle cx="65" cy="82" r="11" fill={BODY} />
      {/* Torso lying */}
      <rect x="42" y="92" width="46" height="12" rx="6" fill={BODY} />

      {/* Arms pressing */}
      <g className="push-arms">
        <rect x="24" y="74" width="20" height="10" rx="5" fill={BODY} transform="rotate(-20 34 79)" />
        <rect x="86" y="74" width="20" height="10" rx="5" fill={BODY} transform="rotate(20 96 79)" />
      </g>

      {/* Dumbbells */}
      <g className="push-db">
        <rect x="16" y="62" width="18" height="10" rx="4" fill={PINK_DARK} />
        <rect x="96" y="62" width="18" height="10" rx="4" fill={PINK_DARK} />
      </g>

      {/* Up arrows */}
      <text x="25" y="52" fontSize="11" fill={PINK}>↑</text>
      <text x="99" y="52" fontSize="11" fill={PINK}>↑</text>

      <text x="65" y="148" textAnchor="middle" fontSize="9" fill={PINK}>Full extension, slow down</text>
    </svg>
  )
}

function LateralRaiseAnim() {
  return (
    <svg viewBox="0 0 140 150" className="w-full h-full">
      <style>{`
        @keyframes lat-arms {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-55deg); }
        }
        .lat-arm-l { animation: lat-arms 2s ease-in-out infinite; transform-origin: 50px 78px; }
        .lat-arm-r {
          animation: lat-arms 2s ease-in-out infinite;
          transform-origin: 90px 78px;
          transform: scaleX(-1);
          animation-direction: normal;
        }
      `}</style>
      <rect x="20" y="136" width="100" height="4" rx="2" fill={PINK_LIGHT} />
      {/* Body */}
      <circle cx="70" cy="42" r="13" fill={BODY} />
      <rect x="52" y="55" width="36" height="48" rx="12" fill={BODY} />
      {/* Legs */}
      <rect x="52" y="98" width="14" height="36" rx="7" fill={BODY} />
      <rect x="74" y="98" width="14" height="36" rx="7" fill={BODY} />
      <ellipse cx="59" cy="137" rx="9" ry="4" fill={PINK} />
      <ellipse cx="81" cy="137" rx="9" ry="4" fill={PINK} />

      {/* Arms */}
      <g className="lat-arm-l">
        <rect x="24" y="72" width="28" height="10" rx="5" fill={BODY} />
        <rect x="14" y="72" width="12" height="10" rx="4" fill={PINK_DARK} />
      </g>
      <g className="lat-arm-r" style={{ transformOrigin: '90px 78px' }}>
        <rect x="88" y="72" width="28" height="10" rx="5" fill={BODY} />
        <rect x="114" y="72" width="12" height="10" rx="4" fill={PINK_DARK} />
      </g>

      <text x="70" y="20" textAnchor="middle" fontSize="9" fill={PINK}>Lead with elbows ↔</text>
    </svg>
  )
}

function CurlAnim() {
  return (
    <svg viewBox="0 0 130 150" className="w-full h-full">
      <style>{`
        @keyframes curl-forearm-l {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-100deg); }
        }
        @keyframes curl-forearm-r {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(100deg); }
        }
        .cf-l { animation: curl-forearm-l 2s ease-in-out infinite; transform-origin: 40px 95px; }
        .cf-r { animation: curl-forearm-r 2s ease-in-out infinite; transform-origin: 90px 95px; }
      `}</style>
      <rect x="15" y="136" width="100" height="4" rx="2" fill={PINK_LIGHT} />
      {/* Body */}
      <circle cx="65" cy="40" r="13" fill={BODY} />
      <rect x="47" y="53" width="36" height="48" rx="12" fill={BODY} />
      {/* Legs */}
      <rect x="47" y="96" width="14" height="38" rx="7" fill={BODY} />
      <rect x="69" y="96" width="14" height="38" rx="7" fill={BODY} />
      <ellipse cx="54" cy="137" rx="9" ry="4" fill={PINK} />
      <ellipse cx="76" cy="137" rx="9" ry="4" fill={PINK} />

      {/* Upper arms - static */}
      <rect x="28" y="68" width="12" height="28" rx="6" fill={BODY} />
      <rect x="90" y="68" width="12" height="28" rx="6" fill={BODY} />

      {/* Forearms that curl */}
      <g className="cf-l">
        <rect x="28" y="95" width="12" height="26" rx="6" fill={BODY} />
        <rect x="22" y="118" width="20" height="10" rx="4" fill={PINK_DARK} />
      </g>
      <g className="cf-r">
        <rect x="90" y="95" width="12" height="26" rx="6" fill={BODY} />
        <rect x="88" y="118" width="20" height="10" rx="4" fill={PINK_DARK} />
      </g>

      <text x="65" y="20" textAnchor="middle" fontSize="9" fill={PINK}>Upper arm stays still</text>
    </svg>
  )
}

function TricepAnim() {
  return (
    <svg viewBox="0 0 130 150" className="w-full h-full">
      <style>{`
        @keyframes tri-forearm {
          0%,100% { transform: rotate(-90deg); }
          50% { transform: rotate(0deg); }
        }
        .tri-l { animation: tri-forearm 2s ease-in-out infinite; transform-origin: 40px 80px; }
        .tri-r { animation: tri-forearm 2s ease-in-out infinite; transform-origin: 90px 80px; animation-delay: 0.1s; }
      `}</style>
      <rect x="15" y="136" width="100" height="4" rx="2" fill={PINK_LIGHT} />
      {/* Cable machine at top */}
      <rect x="52" y="8" width="26" height="8" rx="3" fill={PINK_DARK} />
      <line x1="42" y1="16" x2="42" y2="52" stroke={PINK} strokeWidth="1.5" />
      <line x1="88" y1="16" x2="88" y2="52" stroke={PINK} strokeWidth="1.5" />

      {/* Body */}
      <circle cx="65" cy="40" r="12" fill={BODY} />
      <rect x="48" y="52" width="34" height="44" rx="11" fill={BODY} />
      {/* Legs */}
      <rect x="48" y="91" width="13" height="43" rx="6" fill={BODY} />
      <rect x="69" y="91" width="13" height="43" rx="6" fill={BODY} />
      <ellipse cx="54" cy="137" rx="9" ry="4" fill={PINK} />
      <ellipse cx="75" cy="137" rx="9" ry="4" fill={PINK} />

      {/* Upper arms down, elbows tucked */}
      <rect x="30" y="60" width="12" height="22" rx="6" fill={BODY} />
      <rect x="88" y="60" width="12" height="22" rx="6" fill={BODY} />

      {/* Forearms extending down */}
      <g className="tri-l">
        <rect x="30" y="80" width="12" height="24" rx="6" fill={BODY} />
        <rect x="22" y="100" width="20" height="8" rx="3" fill={PINK_DARK} />
      </g>
      <g className="tri-r">
        <rect x="88" y="80" width="12" height="24" rx="6" fill={BODY} />
        <rect x="86" y="100" width="20" height="8" rx="3" fill={PINK_DARK} />
      </g>

      <text x="65" y="148" textAnchor="middle" fontSize="9" fill={PINK}>Elbows tucked in</text>
    </svg>
  )
}

function KickbackAnim() {
  return (
    <svg viewBox="0 0 150 130" className="w-full h-full">
      <style>{`
        @keyframes kb-leg {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-35deg); }
        }
        .kb-leg { animation: kb-leg 2s ease-in-out infinite; transform-origin: 90px 70px; }
      `}</style>
      {/* Cable machine */}
      <rect x="8" y="30" width="14" height="80" rx="4" fill={PINK_LIGHT} />
      <circle cx="15" cy="70" r="5" fill={PINK_DARK} />
      <line x1="20" y1="70" x2="55" y2="70" stroke={PINK} strokeWidth="1.5" />

      {/* Bench for support */}
      <rect x="40" y="78" width="50" height="10" rx="4" fill={PINK_LIGHT} />

      {/* Body leaning on bench */}
      <circle cx="65" cy="62" r="11" fill={BODY} />
      <rect x="50" y="72" width="30" height="12" rx="6" fill={BODY} />

      {/* Standing leg */}
      <rect x="82" y="80" width="12" height="36" rx="6" fill={BODY} />
      <ellipse cx="88" cy="118" rx="9" ry="4" fill={PINK} />

      {/* Kicking leg */}
      <g className="kb-leg">
        <rect x="90" y="70" width="12" height="20" rx="6" fill={BODY} />
        <rect x="90" y="88" width="12" height="22" rx="6" fill={BODY} />
        <ellipse cx="96" cy="112" rx="9" ry="4" fill={PINK} />
      </g>

      {/* Ankle strap */}
      <text x="90" y="20" textAnchor="middle" fontSize="9" fill={PINK}>Squeeze glute ↑</text>
    </svg>
  )
}

function PlankAnim() {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <style>{`
        @keyframes plank-breathe {
          0%,100% { transform: scaleY(1); }
          50% { transform: scaleY(1.06); }
        }
        @keyframes plank-glow {
          0%,100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .plank-body { animation: plank-breathe 3s ease-in-out infinite; transform-origin: 80px 60px; }
        .plank-core { animation: plank-glow 3s ease-in-out infinite; }
      `}</style>
      <rect x="10" y="84" width="140" height="4" rx="2" fill={PINK_LIGHT} />

      {/* Forearms on ground */}
      <rect x="30" y="76" width="26" height="8" rx="4" fill={BODY} />
      <rect x="104" y="76" width="26" height="8" rx="4" fill={BODY} />

      <g className="plank-body">
        {/* Head */}
        <circle cx="26" cy="64" r="11" fill={BODY} />
        {/* Torso - straight line */}
        <rect x="34" y="58" width="80" height="16" rx="8" fill={BODY} />
        {/* Core highlight */}
        <rect x="58" y="59" width="30" height="14" rx="6" fill="none" stroke={PINK} strokeWidth="2" className="plank-core" />
        {/* Hips + legs */}
        <rect x="110" y="58" width="38" height="14" rx="7" fill={BODY} />
        {/* Feet */}
        <ellipse cx="148" cy="80" rx="8" ry="5" fill={PINK} />
      </g>

      <text x="80" y="20" textAnchor="middle" fontSize="9" fill={PINK}>Straight line — breathe steadily</text>
      <text x="73" y="35" textAnchor="middle" fontSize="8" fill={PINK_DARK}>Core braced ✦</text>
    </svg>
  )
}

function DeadBugAnim() {
  return (
    <svg viewBox="0 0 160 130" className="w-full h-full">
      <style>{`
        @keyframes db-arm {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-70deg); }
        }
        @keyframes db-leg {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(60deg); }
        }
        @keyframes db-arm2 {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(70deg); }
        }
        @keyframes db-leg2 {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-60deg); }
        }
        .db-arm-l { animation: db-arm 3s ease-in-out infinite; transform-origin: 68px 52px; }
        .db-leg-r { animation: db-leg 3s ease-in-out infinite; transform-origin: 100px 80px; }
        .db-arm-r { animation: db-arm2 3s ease-in-out infinite 1.5s; transform-origin: 92px 52px; }
        .db-leg-l { animation: db-leg2 3s ease-in-out infinite 1.5s; transform-origin: 60px 80px; }
      `}</style>
      <rect x="15" y="118" width="130" height="4" rx="2" fill={PINK_LIGHT} />

      {/* Body lying flat - head, torso */}
      <circle cx="80" cy="32" r="12" fill={BODY} />
      <rect x="60" y="44" width="40" height="42" rx="10" fill={BODY} />

      {/* Core glow */}
      <rect x="62" y="52" width="36" height="26" rx="8" fill="none" stroke={PINK} strokeWidth="1.5" opacity="0.6" />

      {/* Left arm extending */}
      <g className="db-arm-l">
        <rect x="38" y="46" width="30" height="10" rx="5" fill={BODY} />
        <rect x="22" y="44" width="18" height="10" rx="4" fill={BODY} />
      </g>

      {/* Right leg extending */}
      <g className="db-leg-r">
        <rect x="94" y="82" width="12" height="30" rx="6" fill={BODY} />
        <rect x="90" y="108" width="20" height="10" rx="5" fill={BODY} />
        <ellipse cx="100" cy="118" rx="9" ry="4" fill={PINK} />
      </g>

      {/* Right arm extending (opposite phase) */}
      <g className="db-arm-r">
        <rect x="92" y="46" width="30" height="10" rx="5" fill={BODY} />
        <rect x="120" y="44" width="18" height="10" rx="4" fill={BODY} />
      </g>

      {/* Left leg extending */}
      <g className="db-leg-l">
        <rect x="54" y="82" width="12" height="30" rx="6" fill={BODY} />
        <rect x="50" y="108" width="20" height="10" rx="5" fill={BODY} />
        <ellipse cx="60" cy="118" rx="9" ry="4" fill={PINK} />
      </g>

      <text x="80" y="14" textAnchor="middle" fontSize="9" fill={PINK}>Opposite arm + leg</text>
    </svg>
  )
}

function GenericAnim() {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full">
      <style>{`
        @keyframes gen-pulse {
          0%,100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .gen-body { animation: gen-pulse 2s ease-in-out infinite; transform-origin: 60px 70px; }
      `}</style>
      <rect x="15" y="128" width="90" height="4" rx="2" fill={PINK_LIGHT} />
      <g className="gen-body">
        <circle cx="60" cy="32" r="13" fill={BODY} />
        <rect x="44" y="45" width="32" height="44" rx="11" fill={BODY} />
        <rect x="26" y="52" width="18" height="10" rx="5" fill={BODY} />
        <rect x="76" y="52" width="18" height="10" rx="5" fill={BODY} />
        <rect x="44" y="86" width="14" height="40" rx="7" fill={BODY} />
        <rect x="62" y="86" width="14" height="40" rx="7" fill={BODY} />
        <ellipse cx="51" cy="129" rx="9" ry="4" fill={PINK} />
        <ellipse cx="69" cy="129" rx="9" ry="4" fill={PINK} />
      </g>
    </svg>
  )
}

const ANIM_COMPONENTS: Record<AnimationType, () => JSX.Element> = {
  squat: SquatAnim,
  hip_thrust: HipThrustAnim,
  hinge: HingeAnim,
  pull_vertical: PullVerticalAnim,
  pull_horizontal: PullHorizontalAnim,
  push: PushAnim,
  lateral_raise: LateralRaiseAnim,
  curl: CurlAnim,
  tricep: TricepAnim,
  kickback: KickbackAnim,
  core_plank: PlankAnim,
  core_dead_bug: DeadBugAnim,
  generic: GenericAnim,
}

export default function ExerciseAnimation({ name }: { name: string }) {
  const type = getAnimationType(name)
  const AnimComp = ANIM_COMPONENTS[type]
  const tip = getLabel(type)

  return (
    <div className="bg-blush-50 rounded-2xl p-3 flex flex-col items-center gap-2">
      <div className="w-full max-w-[140px] h-[120px] mx-auto">
        <AnimComp />
      </div>
      <p className="text-[11px] font-semibold text-pink-500 text-center leading-snug">{tip}</p>
    </div>
  )
}
