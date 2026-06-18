import { createClient } from '@/lib/supabase/server'
import { USER_ID } from '@/lib/user'
import { getProgramDay, TYPE_LABELS, TYPE_EMOJI } from '@/lib/program'
import Link from 'next/link'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function ActivityRing({
  pct, color, size = 80, label, value,
}: { pct: number; color: string; size?: number; label: string; value: string }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 1)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={10} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-white/80">{label}</span>
      <span className="text-xs text-white/60">{value}</span>
    </div>
  )
}

// Progress ring for "Day X of 30"
function ProgressRing({ day }: { day: number }) {
  const size = 92
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(day / 30, 1)
  const dash = circ * pct
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FCE7F3" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#EC4899" strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900 leading-none">{day}</span>
        <span className="text-[10px] font-bold text-gray-400">/ 30</span>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [profileRes, todayLogRes, recentLogsRes, challengeRes, checkinsRes] = await Promise.all([
    supabase.from('ll_profile').select('*').eq('user_id', USER_ID).maybeSingle(),
    supabase.from('ll_daily_logs').select('*').eq('user_id', USER_ID).eq('date', today).maybeSingle(),
    supabase.from('ll_daily_logs').select('date,workout_completed,step_count')
      .eq('user_id', USER_ID).order('date', { ascending: false }).limit(30),
    supabase.from('ll_challenge_profile').select('*').eq('user_id', USER_ID).maybeSingle(),
    supabase.from('ll_checkins').select('weight_kg,sleep_hours,hrv,date')
      .eq('user_id', USER_ID).order('date', { ascending: false }).limit(10),
  ])

  const profile = profileRes.data
  const todayLog = todayLogRes.data
  const recentLogs = recentLogsRes.data ?? []
  const challenge = challengeRes.data
  const checkins = checkinsRes.data ?? []

  const name = profile?.name ?? 'Momo'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentWeight = todayLog?.weight_kg ?? ((recentLogs as any[]).find((l) => l.weight_kg)?.weight_kg ?? null)
  const stepGoal = profile?.step_goal ?? 10000
  const todaySteps = todayLog?.step_count ?? 0

  // ── Challenge day computation ──
  const hasChallenge = !!challenge?.challenge_start_date
  let challengeDay = 1
  if (hasChallenge) {
    const start = new Date(challenge!.challenge_start_date!)
    const diff = Math.floor((new Date().getTime() - start.getTime()) / 86400000)
    challengeDay = Math.max(1, Math.min(30, diff + 1))
  }
  const program = getProgramDay(challengeDay)

  // ── Latest check-in quick stats ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastWeight = (checkins as any[]).find((c) => c.weight_kg)?.weight_kg ?? currentWeight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSleep = (checkins as any[]).find((c) => c.sleep_hours)?.sleep_hours ?? todayLog?.sleep_hours ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastHrv = (checkins as any[]).find((c) => c.hrv)?.hrv ?? null

  let streak = 0
  const sortedDates = recentLogs.map((l: { date: string }) => l.date).sort().reverse()
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    if (sortedDates[i] === expected.toISOString().split('T')[0]) streak++
    else break
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-4">

      {/* ── Hero header ── */}
      <div className="gradient-hero px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />

        <span className="absolute top-6 right-12 text-gold-200 text-sm gold-pulse">✦</span>
        <span className="absolute top-14 right-6 text-gold-200 text-[10px] gold-pulse" style={{ animationDelay: '0.8s' }}>✦</span>
        <span className="absolute bottom-8 right-20 text-gold-200 text-xs gold-pulse" style={{ animationDelay: '1.4s' }}>✦</span>

        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-gold-sm">
            <span className="font-serif font-bold text-white text-sm tracking-tight">MF</span>
          </div>
          <div>
            <p className="font-serif font-bold text-white text-lg leading-none tracking-wide">MomoFit</p>
            <p className="text-[9px] font-bold tracking-[0.18em] text-gold-200 uppercase leading-none mt-0.5">Your Glow Era</p>
          </div>
        </div>

        <p className="text-white/70 text-sm font-medium">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{greeting}, {name} ✨</h1>

        <div className="flex justify-around mt-6 pt-4 border-t border-white/15">
          <ActivityRing
            pct={todayLog?.workout_completed ? 1 : 0}
            color="#FDE68A"
            label="Workout"
            value={todayLog?.workout_completed ? 'Done ✓' : 'Pending'}
          />
          <ActivityRing
            pct={todaySteps / stepGoal}
            color="#F9A8D4"
            label="Steps"
            value={todaySteps.toLocaleString()}
          />
          <ActivityRing
            pct={Math.min((todayLog?.sleep_hours ?? 0) / 8, 1)}
            color="#C4B5FD"
            label="Sleep"
            value={todayLog?.sleep_hours ? `${todayLog.sleep_hours}h` : '—'}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 space-y-4">

        {/* 30-day challenge progress */}
        <div className="card-luxury p-5 flex items-center gap-4">
          <ProgressRing day={challengeDay} />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">30-Day Challenge</p>
            <p className="text-xl font-bold text-gray-900">Day {challengeDay} of 30</p>
            {hasChallenge ? (
              <p className="text-xs text-gray-400 mt-0.5">{30 - challengeDay} days left to glow ✨</p>
            ) : (
              <p className="text-xs text-pink-500 font-bold mt-0.5">Start your challenge today!</p>
            )}
          </div>
        </div>

        {/* Today's program card */}
        <div className="card-luxury p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Today&apos;s Program</p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-pink-500 bg-blush-50 px-2.5 py-1 rounded-full">
              {TYPE_EMOJI[program.type]} {TYPE_LABELS[program.type]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">{program.title}</h2>
          <p className="text-sm text-gray-500">{program.hook}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>🏃 {program.cardio}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Link
              href={`/workout/${challengeDay}`}
              className="gradient-pink text-white text-center font-bold py-3.5 rounded-2xl shadow-pink-sm active:scale-95 transition-transform"
            >
              Start Workout
            </Link>
            <Link
              href={`/checkin/${challengeDay}`}
              className="bg-blush-100 text-pink-600 text-center font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
            >
              Check In
            </Link>
          </div>
        </div>

        {/* Quick stats from check-ins */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Weight', value: lastWeight ? `${lastWeight} kg` : '—', icon: '⚖️' },
            { label: 'Sleep', value: lastSleep ? `${lastSleep}h` : '—', icon: '😴' },
            { label: 'HRV', value: lastHrv ? `${Math.round(lastHrv)}` : '—', icon: '❤️' },
          ].map((s) => (
            <div key={s.label} className="card-luxury p-4 text-center">
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Streak + quick links */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-luxury p-4 flex items-center gap-3">
            <div className="w-11 h-11 gradient-gold rounded-2xl flex items-center justify-center shadow-gold-sm flex-shrink-0 text-xl">
              🔥
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{streak}d</p>
              <p className="text-xs text-gray-400">streak</p>
            </div>
          </div>
          <Link href="/recovery" className="card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-11 h-11 gradient-pink rounded-2xl flex items-center justify-center shadow-pink-sm flex-shrink-0 text-xl">
              💗
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Recovery</p>
              <p className="text-xs text-gray-400">View score</p>
            </div>
          </Link>
        </div>

        {/* Quick links row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/meals" className="card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-11 h-11 gradient-gold rounded-2xl flex items-center justify-center shadow-gold-sm flex-shrink-0 text-xl">
              🥗
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Meals</p>
              <p className="text-xs text-gray-400">Macros & timing</p>
            </div>
          </Link>
          <Link href="/progress" className="card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-11 h-11 gradient-pink rounded-2xl flex items-center justify-center shadow-pink-sm flex-shrink-0 text-xl">
              📈
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Progress</p>
              <p className="text-xs text-gray-400">View charts</p>
            </div>
          </Link>
        </div>

        {/* Motivational footer */}
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-gold-400 text-xs gold-pulse">✦</span>
          <p className="text-xs font-bold tracking-[0.15em] text-pink-300 uppercase">Your Glow Era</p>
          <span className="text-gold-400 text-xs gold-pulse" style={{ animationDelay: '1s' }}>✦</span>
        </div>

      </div>
    </div>
  )
}
