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
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="text-xs text-gray-400">{value}</span>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [profileRes, todayLogRes, recentLogsRes] = await Promise.all([
    supabase.from('ll_profile').select('*').eq('user_id', USER_ID).single(),
    supabase.from('ll_daily_logs').select('*').eq('user_id', USER_ID).eq('date', today).single(),
    supabase.from('ll_daily_logs').select('date,workout_completed,step_count')
      .eq('user_id', USER_ID).order('date', { ascending: false }).limit(30),
  ])

  const profile = profileRes.data
  const todayLog = todayLogRes.data
  const recentLogs = recentLogsRes.data ?? []

  const name = profile?.name ?? 'Athlete'
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
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{formatDate(new Date())}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{greeting}, {name} 👋</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white font-bold text-lg shadow-md">
          {name[0]?.toUpperCase()}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Weight', value: currentWeight ? `${currentWeight} kg` : '—', sub: 'current' },
          { label: 'Streak', value: `${streak}d`, sub: 'days in a row' },
          { label: 'Workouts', value: workoutsThisWeek.toString(), sub: 'this week' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-3xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-300">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Activity rings */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Today&apos;s Activity</h2>
        <div className="flex justify-around">
          <ActivityRing
            pct={todayLog?.workout_completed ? 1 : 0}
            color="#FF6B00"
            label="Workout"
            value={todayLog?.workout_completed ? 'Done' : 'Pending'}
          />
          <ActivityRing
            pct={todaySteps / stepGoal}
            color="#8B5CF6"
            label="Steps"
            value={`${todaySteps.toLocaleString()}`}
          />
          <ActivityRing
            pct={Math.min((todayLog?.sleep_hours ?? 0) / 8, 1)}
            color="#3B82F6"
            label="Sleep"
            value={todayLog?.sleep_hours ? `${todayLog.sleep_hours}h` : '—'}
          />
        </div>
      </div>

      {/* Today's summary card */}
      {todayLog && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Today&apos;s Log</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {todayLog.energy_level && (
              <div className="flex justify-between">
                <span className="text-gray-400">Energy</span>
                <span className="font-semibold text-gray-800">{todayLog.energy_level}/10</span>
              </div>
            )}
            {todayLog.mood_level && (
              <div className="flex justify-between">
                <span className="text-gray-400">Mood</span>
                <span className="font-semibold text-gray-800">{todayLog.mood_level}/10</span>
              </div>
            )}
            {todayLog.calories && (
              <div className="flex justify-between">
                <span className="text-gray-400">Calories</span>
                <span className="font-semibold text-gray-800">{todayLog.calories} kcal</span>
              </div>
            )}
            {todayLog.notes && (
              <div className="col-span-2">
                <span className="text-gray-400 block">Notes</span>
                <span className="font-medium text-gray-700 text-xs">{todayLog.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/log"
        className="block w-full gradient-orange text-white text-center font-bold text-base py-4 rounded-3xl shadow-lg shadow-orange-200 active:scale-95 transition-transform"
      >
        {todayLog ? 'Update Today\'s Log' : 'Log Today →'}
      </Link>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/workout" className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 gradient-orange rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg">💪</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Workout</p>
            <p className="text-xs text-gray-400">Start session</p>
          </div>
        </Link>
        <Link href="/progress" className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-purple-500 rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg">📈</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Progress</p>
            <p className="text-xs text-gray-400">View charts</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
