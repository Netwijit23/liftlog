'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface DailyLog {
  date: string
  weight_kg: number | null
  waist_cm: number | null
  sleep_hours: number | null
  step_count: number | null
  calories: number | null
}

interface WorkoutLog {
  date: string
  sets: { exerciseName: string; sets: { reps: number; weight: number }[] }[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-pink-sm space-y-3">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      {children}
    </div>
  )
}

const axisStyle = { fontSize: 10, fill: '#9CA3AF' }

export default function ProgressPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])

  const load = useCallback(async () => {
    const [logsRes, wRes] = await Promise.all([
      supabase.from('ll_daily_logs').select('date,weight_kg,waist_cm,sleep_hours,step_count,calories')
        .eq('user_id', USER_ID).order('date').limit(90),
      supabase.from('ll_workout_logs').select('date,sets').eq('user_id', USER_ID).order('date').limit(90),
    ])
    if (logsRes.data) setLogs(logsRes.data)
    if (wRes.data) setWorkoutLogs(wRes.data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const weightData = logs
    .filter((l) => l.weight_kg)
    .map((l) => ({ date: l.date.slice(5), value: l.weight_kg }))

  const waistData = logs
    .filter((l) => l.waist_cm)
    .map((l) => ({ date: l.date.slice(5), value: l.waist_cm }))

  const sleepData = logs
    .filter((l) => l.sleep_hours)
    .map((l) => ({ date: l.date.slice(5), value: l.sleep_hours }))

  // Weekly workout volume (weight × reps summed per week)
  const volumeByWeek: Record<string, number> = {}
  for (const wl of workoutLogs) {
    const week = getWeekLabel(wl.date)
    let vol = 0
    for (const ex of wl.sets) {
      for (const s of ex.sets) {
        vol += s.weight * s.reps
      }
    }
    volumeByWeek[week] = (volumeByWeek[week] ?? 0) + vol
  }
  const volumeData = Object.entries(volumeByWeek).map(([week, volume]) => ({ week, volume }))

  const empty = (
    <p className="text-sm text-gray-300 text-center py-6">No data yet — start logging!</p>
  )

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      <Section title="⚖️ Weight (kg)">
        {weightData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weightData} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F472B6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F472B6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, 'Weight']}
              />
              <Area type="monotone" dataKey="value" stroke="#F472B6" strokeWidth={2} fill="url(#wGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      <Section title="📏 Waist (cm)">
        {waistData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={waistData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: number) => [`${v} cm`, 'Waist']}
              />
              <Line type="monotone" dataKey="value" stroke="#A855F7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      <Section title="😴 Sleep (hours)">
        {sleepData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sleepData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} domain={[0, 10]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: number) => [`${v}h`, 'Sleep']}
              />
              <ReferenceLine y={7.5} stroke="#C084FC" strokeDasharray="4 4" label={{ value: '7.5h', position: 'right', fontSize: 10, fill: '#C084FC' }} />
              <Bar dataKey="value" fill="#818CF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      <Section title="🏋️ Weekly Volume (kg·reps)">
        {volumeData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volumeData} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F472B6" />
                  <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="week" tick={axisStyle} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString()} kg·reps`, 'Volume']}
              />
              <Bar dataKey="volume" fill="url(#volGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>
    </div>
  )
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0].slice(5)
}
