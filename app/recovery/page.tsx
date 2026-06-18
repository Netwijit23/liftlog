'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'
import { calcRecovery } from '@/lib/recovery'
import type { Checkin, RecoveryResult } from '@/types'

const SECTION_LABEL = 'text-xs font-bold uppercase tracking-widest text-gray-400'

function statusColor(ok: boolean, mid: boolean): string {
  if (ok) return '#22C55E'
  if (mid) return '#EAB308'
  return '#EF4444'
}

function Gauge({ result }: { result: RecoveryResult }) {
  const size = 220
  const stroke = 18
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // 270° arc (gauge style), start at 135°
  const startAngle = 135
  const sweep = 270
  const circ = 2 * Math.PI * r
  const arcLen = (sweep / 360) * circ
  const dash = (result.score / 100) * arcLen

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: `rotate(${startAngle}deg)` }}>
        <defs>
          <linearGradient id="recArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9A8D4" />
            <stop offset="60%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#FCE7F3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#recArc)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-gray-900">{result.score}</span>
        <span
          className="text-sm font-bold mt-1"
          style={{ color: result.color }}
        >
          {result.label}
        </span>
        <span className="text-xs text-gray-400 mt-0.5">Recovery Score</span>
      </div>
    </div>
  )
}

const MODALITIES: { key: keyof Checkin; label: string; emoji: string }[] = [
  { key: 'recovery_steam', label: 'Steam', emoji: '🧖' },
  { key: 'recovery_sauna', label: 'Sauna', emoji: '🌡️' },
  { key: 'recovery_ice_bath', label: 'Ice Bath', emoji: '🧊' },
  { key: 'recovery_mobility', label: 'Mobility', emoji: '🧘' },
]

export default function RecoveryPage() {
  const supabase = createClient()
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('ll_checkins')
        .select('*')
        .eq('user_id', USER_ID)
        .order('date', { ascending: false })
        .limit(1)
      // prefer today's, else most recent
      let row = (data ?? []).find((d) => d.date === today) ?? (data ?? [])[0] ?? null
      setCheckin(row)
      setLoading(false)
    })()
  }, [supabase])

  const toggleModality = async (key: keyof Checkin) => {
    if (!checkin) return
    const next = !checkin[key]
    setCheckin({ ...checkin, [key]: next })
    await supabase
      .from('ll_checkins')
      .update({ [key]: next, updated_at: new Date().toISOString() })
      .eq('user_id', USER_ID)
      .eq('day_number', checkin.day_number)
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="card-luxury p-8 text-center text-gray-400">Loading…</div>
      </div>
    )
  }

  const hasData =
    checkin &&
    (checkin.hrv != null ||
      checkin.sleep_score != null ||
      checkin.body_battery != null ||
      checkin.resting_hr != null)

  if (!checkin || !hasData) {
    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Recovery</h1>
        <div className="card-luxury p-8 text-center space-y-3">
          <p className="text-4xl">🌸</p>
          <p className="font-bold text-gray-800">Check in first</p>
          <p className="text-sm text-gray-500">
            Sync your morning biometrics in the check-in to see your recovery score.
          </p>
          <Link
            href={`/checkin/${checkin?.day_number ?? 1}`}
            className="inline-block gradient-pink text-white font-bold py-3 px-6 rounded-2xl shadow-pink-sm active:scale-95 transition-transform"
          >
            Go to Check-In
          </Link>
        </div>
      </div>
    )
  }

  const result = calcRecovery(checkin)

  const metrics = [
    {
      label: 'HRV',
      value: checkin.hrv != null ? `${Math.round(checkin.hrv)} ms` : '—',
      computed: checkin.hrv_computed,
      ok: (checkin.hrv ?? 0) >= 60,
      mid: (checkin.hrv ?? 0) >= 40,
    },
    {
      label: 'Sleep Score',
      value: checkin.sleep_score != null ? `${Math.round(checkin.sleep_score)}` : '—',
      computed: checkin.sleep_score_computed,
      ok: (checkin.sleep_score ?? 0) >= 80,
      mid: (checkin.sleep_score ?? 0) >= 60,
    },
    {
      label: 'Body Battery',
      value: checkin.body_battery != null ? `${Math.round(checkin.body_battery)}` : '—',
      computed: checkin.body_battery_computed,
      ok: (checkin.body_battery ?? 0) >= 70,
      mid: (checkin.body_battery ?? 0) >= 50,
    },
    {
      label: 'Resting HR',
      value: checkin.resting_hr != null ? `${Math.round(checkin.resting_hr)} bpm` : '—',
      computed: checkin.resting_hr_computed,
      ok: (checkin.resting_hr ?? 99) <= 58,
      mid: (checkin.resting_hr ?? 99) <= 68,
    },
    {
      label: 'Stress Score',
      value: checkin.stress_score != null ? `${Math.round(checkin.stress_score)}` : '—',
      computed: checkin.stress_score_computed,
      ok: (checkin.stress_score ?? 99) <= 35,
      mid: (checkin.stress_score ?? 99) <= 55,
    },
    {
      label: 'Training Load',
      value: checkin.training_load != null ? `${Math.round(checkin.training_load)}` : '—',
      computed: checkin.training_load_computed,
      ok: (checkin.training_load ?? 0) <= 50,
      mid: (checkin.training_load ?? 0) <= 80,
    },
  ]

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Recovery</h1>

      {/* Gauge */}
      <div className="card-luxury p-6 flex flex-col items-center">
        <Gauge result={result} />
        <div className="flex items-center gap-2 mt-3 bg-blush-50 rounded-2xl px-4 py-2">
          <span className="text-lg">🕐</span>
          <span className="text-sm font-bold text-gray-700">
            ~{result.recoveryHours}h to full recovery
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="card-luxury p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">
                {m.label}
              </p>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: statusColor(m.ok, m.mid) }}
              />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {m.value}
              {m.computed && (
                <span className="text-[10px] font-bold text-gray-400 ml-1">· est</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Modalities */}
      <div className="card-luxury p-5 space-y-3">
        <p className={SECTION_LABEL}>Recovery Modalities</p>
        <div className="grid grid-cols-2 gap-2">
          {MODALITIES.map((m) => {
            const active = !!checkin[m.key]
            return (
              <button
                key={String(m.key)}
                onClick={() => toggleModality(m.key)}
                className={`py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all flex flex-col items-center gap-1 ${
                  active
                    ? 'gradient-pink text-white shadow-pink-sm'
                    : 'bg-blush-50 text-gray-600 border border-blush-200'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                {m.label}
                {active && <span className="text-[10px]">Done ✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
