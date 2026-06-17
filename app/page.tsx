import { createClient } from '@/lib/supabase/server'
import { USER_ID } from '@/lib/user'
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

export default async function HomePage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [profileRes, todayLogRes, recentLogsRes] = await Promise.all([
    supabase.from('ll_profile').select('*').eq('user_id', USER_ID).maybeSingle(),
    supabase.from('ll_daily_logs').select('*').eq('user_id', USER_ID).eq('date', today).maybeSingle(),
    supabase.from('ll_daily_logs').select('date,workout_completed,step_count')
      .eq('user_id', USER_ID).order('date', { ascending: false }).limit(30),
  ])

  const profile = profileRes.data
  const todayLog = todayLogRes.data
  const recentLogs = recentLogsRes.data ?? []

  const name = profile?.name ?? 'Momo'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentWeight = todayLog?.weight_kg ?? ((recentLogs as any[]).find((l) => l.weight_kg)?.weight_kg ?? null)
  const stepGoal = profile?.step_goal ?? 10000
  const todaySteps = todayLog?.step_count ?? 0
  const workoutsThisWeek = recentLogs.filter((l: { workout_completed?: boolean; date: string }) => {
    const diff = (new Date().getTime() - new Date(l.date).getTime()) / 86400000
    return diff <= 7 && l.workout_completed
  }).length

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
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />

        {/* Gold sparkles */}
        <span className="absolute top-6 right-12 text-gold-200 text-sm gold-pulse">✦</span>
        <span className="absolute top-14 right-6 text-gold-200 text-[10px] gold-pulse" style={{ animationDelay: '0.8s' }}>✦</span>
        <span className="absolute bottom-8 right-20 text-gold-200 text-xs gold-pulse" style={{ animationDelay: '1.4s' }}>✦</span>

        {/* Brand wordmark */}
        <div className="flex items-center gap-2 mb-5">
          {/* MF badge */}
          <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-gold-sm">
            <span className="font-serif font-bold text-white text-sm tracking-tight">MF</span>
          </div>
          <div>
            <p className="font-serif font-bold text-white text-lg leading-none tracking-wide">MomoFit</p>
            <p className="text-[9px] font-bold tracking-[0.18em] text-gold-200 uppercase leading-none mt-0.5">Your Glow Era</p>
          </div>
        </div>

        {/* Greeting */}
        <p className="text-white/70 text-sm font-medium">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{greeting}, {name} ✨</h1>

        {/* Activity rings inside hero */}
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

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Weight', value: currentWeight ? `${currentWeight} kg` : '—', sub: 'current', icon: '⚖️' },
            { label: 'Streak', value: `${streak}d`, sub: 'days in a row', icon: '🔥' },
            { label: 'Workouts', value: workoutsThisWeek.toString(), sub: 'this week', icon: '💪' },
          ].map((s) => (
            <div key={s.label} className="card-luxury p-4 text-center">
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/log"
          className="block w-full gradient-pink text-white text-center font-bold text-base py-4 rounded-3xl shadow-pink-md active:scale-95 transition-transform relative overflow-hidden"
        >
          <span className="relative z-10">
            {todayLog ? '✏️  Update Today\'s Log' : '📋  Log Today →'}
          </span>
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/workout" className="card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-11 h-11 gradient-pink rounded-2xl flex items-center justify-center shadow-pink-sm flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15M8 8l-3.5 4 3.5 4M16 8l3.5 4-3.5 4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Workout</p>
              <p className="text-xs text-gray-400">Start session</p>
            </div>
          </Link>
          <Link href="/progress" className="card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-11 h-11 gradient-gold rounded-2xl flex items-center justify-center shadow-gold-sm flex-shrink-0">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Progress</p>
              <p className="text-xs text-gray-400">View charts</p>
            </div>
          </Link>
        </div>

        {/* Today's log detail (if exists) */}
        {todayLog && (
          <div className="card-luxury p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full gradient-pink" />
              <h2 className="text-sm font-bold text-gray-800">Today&apos;s Log</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {todayLog.energy_level && (
                <div className="bg-blush-50 rounded-2xl px-3 py-2 flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Energy</span>
                  <span className="font-bold text-gray-800">{todayLog.energy_level}/10</span>
                </div>
              )}
              {todayLog.mood_level && (
                <div className="bg-blush-50 rounded-2xl px-3 py-2 flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Mood</span>
                  <span className="font-bold text-gray-800">{todayLog.mood_level}/10</span>
                </div>
              )}
              {todayLog.calories && (
                <div className="bg-blush-50 rounded-2xl px-3 py-2 flex justify-between items-center col-span-2">
                  <span className="text-gray-500 text-xs">Calories</span>
                  <span className="font-bold text-gray-800">{todayLog.calories} kcal</span>
                </div>
              )}
              {todayLog.notes && (
                <div className="col-span-2 bg-blush-50 rounded-2xl px-3 py-2">
                  <span className="text-gray-400 text-xs block mb-0.5">Notes</span>
                  <span className="font-medium text-gray-700 text-xs">{todayLog.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
