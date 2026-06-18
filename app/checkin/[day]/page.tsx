'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'
import { getProgramDay } from '@/lib/program'
import type {
  Checkin,
  MorningAnalysis,
  PostActivityAnalysis,
  EveningAnalysis,
} from '@/types'
import Confetti from '@/components/Confetti'

type Tab = 'morning' | 'post' | 'evening'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'morning', label: 'Morning', emoji: '☀️' },
  { id: 'post', label: 'Post-Activity', emoji: '⚡' },
  { id: 'evening', label: 'Evening', emoji: '🌙' },
]

// Tap-select option groups for body readiness
const READINESS: { key: keyof Checkin; label: string; options: { value: string; emoji: string }[] }[] = [
  {
    key: 'fatigue',
    label: 'Fatigue',
    options: [
      { value: 'none', emoji: '😃' },
      { value: 'mild', emoji: '🙂' },
      { value: 'moderate', emoji: '😐' },
      { value: 'severe', emoji: '😫' },
    ],
  },
  {
    key: 'soreness',
    label: 'Soreness',
    options: [
      { value: 'none', emoji: '😃' },
      { value: 'mild', emoji: '🙂' },
      { value: 'moderate', emoji: '😣' },
      { value: 'severe', emoji: '😖' },
    ],
  },
  {
    key: 'motivation',
    label: 'Motivation',
    options: [
      { value: 'low', emoji: '😴' },
      { value: 'ok', emoji: '🙂' },
      { value: 'high', emoji: '😄' },
      { value: 'fired', emoji: '🔥' },
    ],
  },
  {
    key: 'joint_feel',
    label: 'Joint feel',
    options: [
      { value: 'great', emoji: '💪' },
      { value: 'good', emoji: '🙂' },
      { value: 'achy', emoji: '😬' },
      { value: 'painful', emoji: '🤕' },
    ],
  },
]

const FEELINGS = [
  { value: 'crushed', label: 'Crushed it', emoji: '🔥' },
  { value: 'good', label: 'Good', emoji: '😄' },
  { value: 'tough', label: 'Tough', emoji: '😅' },
  { value: 'drained', label: 'Drained', emoji: '😮‍💨' },
]

const NUTRITION = [
  { value: 'great', label: 'Great', emoji: '🥗' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'ok', label: 'OK', emoji: '😐' },
  { value: 'poor', label: 'Poor', emoji: '🍔' },
]

function readinessColor(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('optimal')) return '#22C55E'
  if (l.includes('good')) return '#EAB308'
  if (l.includes('moderate')) return '#F97316'
  return '#EF4444'
}

const SECTION_LABEL = 'text-xs font-bold uppercase tracking-widest text-gray-400'

export default function CheckinPage() {
  const params = useParams()
  const day = Math.max(1, Math.min(30, parseInt(String(params.day), 10) || 1))
  const program = getProgramDay(day)
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('morning')
  const [form, setForm] = useState<Partial<Checkin>>({})
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const [morningAI, setMorningAI] = useState<MorningAnalysis | null>(null)
  const [postAI, setPostAI] = useState<PostActivityAnalysis | null>(null)
  const [eveningAI, setEveningAI] = useState<EveningAnalysis | null>(null)

  // Default tab by hour
  useEffect(() => {
    setTab(new Date().getHours() < 13 ? 'morning' : 'post')
  }, [])

  // Load cached AI + existing checkin
  useEffect(() => {
    try {
      const m = localStorage.getItem(`momofit_morning_ai_d${day}`)
      if (m) setMorningAI(JSON.parse(m))
      const p = localStorage.getItem(`momofit_post_ai_d${day}`)
      if (p) setPostAI(JSON.parse(p))
      const e = localStorage.getItem(`momofit_evening_ai_d${day}`)
      if (e) setEveningAI(JSON.parse(e))
    } catch {}
    ;(async () => {
      const { data } = await supabase
        .from('ll_checkins')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('day_number', day)
        .maybeSingle()
      if (data) setForm(data)
    })()
  }, [day, supabase])

  const set = (k: keyof Checkin, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  const upsert = useCallback(
    async (patch: Partial<Checkin>) => {
      const today = new Date().toISOString().split('T')[0]
      const payload = {
        ...form,
        ...patch,
        user_id: USER_ID,
        day_number: day,
        date: today,
        updated_at: new Date().toISOString(),
      }
      // strip id so upsert by unique key works cleanly
      delete (payload as Record<string, unknown>).id
      delete (payload as Record<string, unknown>).created_at
      const { error } = await supabase
        .from('ll_checkins')
        .upsert(payload, { onConflict: 'user_id,day_number' })
      if (!error) setForm((f) => ({ ...f, ...patch }))
      return error
    },
    [form, day, supabase]
  )

  const syncMorning = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'morning', day_number: day, data: {} }),
      })
      await res.json()
      // reload checkin to get synced biometrics
      const { data } = await supabase
        .from('ll_checkins')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('day_number', day)
        .maybeSingle()
      if (data) setForm(data)
    } catch {}
    setSyncing(false)
  }

  const syncActivity = async () => {
    setSyncing(true)
    try {
      await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'activity', day_number: day, data: {} }),
      })
      const { data } = await supabase
        .from('ll_checkins')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('day_number', day)
        .maybeSingle()
      if (data) setForm(data)
    } catch {}
    setSyncing(false)
  }

  const saveMorning = async () => {
    setSaving(true)
    const err = await upsert({
      weight_kg: form.weight_kg ?? null,
      waist_cm: form.waist_cm ?? null,
      sleep_hours: form.sleep_hours ?? null,
      energy: form.energy ?? null,
      mood: form.mood ?? null,
      fatigue: form.fatigue ?? null,
      soreness: form.soreness ?? null,
      motivation: form.motivation ?? null,
      joint_feel: form.joint_feel ?? null,
    })
    if (err) { showToast('Save failed — check connection', false); setSaving(false); return }
    try {
      const res = await fetch('/api/ai/morning-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, program_type: program.type, day }),
      })
      const ai = (await res.json()) as MorningAnalysis
      setMorningAI(ai)
      localStorage.setItem(`momofit_morning_ai_d${day}`, JSON.stringify(ai))
      setConfetti(true)
      setTimeout(() => setConfetti(false), 2500)
      showToast('Morning check-in saved ✨')
    } catch { showToast('Saved, but AI analysis failed', false) }
    setSaving(false)
  }

  const savePost = async () => {
    setSaving(true)
    const err = await upsert({
      rpe: form.rpe ?? null,
      workout_feeling: form.workout_feeling ?? null,
      workout_notes: form.workout_notes ?? null,
    })
    if (err) { showToast('Save failed — check connection', false); setSaving(false); return }
    try {
      const res = await fetch('/api/ai/post-activity-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, program_type: program.type, day }),
      })
      const ai = (await res.json()) as PostActivityAnalysis
      setPostAI(ai)
      localStorage.setItem(`momofit_post_ai_d${day}`, JSON.stringify(ai))
      showToast('Post-activity saved ⚡')
    } catch { showToast('Saved, but AI analysis failed', false) }
    setSaving(false)
  }

  const saveEvening = async () => {
    setSaving(true)
    const err = await upsert({
      steps: form.steps ?? null,
      calories: form.calories ?? null,
      water_liters: form.water_liters ?? null,
      nutrition_quality: form.nutrition_quality ?? null,
    })
    if (err) { showToast('Save failed — check connection', false); setSaving(false); return }
    try {
      const res = await fetch('/api/ai/evening-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, program_type: program.type, day }),
      })
      const ai = (await res.json()) as EveningAnalysis
      setEveningAI(ai)
      localStorage.setItem(`momofit_evening_ai_d${day}`, JSON.stringify(ai))
      showToast('Evening check-in saved 🌙')
    } catch { showToast('Saved, but AI analysis failed', false) }
    setSaving(false)
  }

  const numInput = (
    k: keyof Checkin,
    label: string,
    placeholder: string,
    step = '0.1'
  ) => (
    <div className="flex-1">
      <label className="text-xs font-bold text-gray-500 mb-1 block">{label}</label>
      <input
        type="number"
        step={step}
        value={(form[k] as number | null) ?? ''}
        onChange={(e) => set(k, e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-blush-50 border border-blush-200 rounded-2xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:border-pink-300"
      />
    </div>
  )

  const slider = (k: keyof Checkin, label: string) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-gray-500">{label}</label>
        <span className="text-sm font-bold text-pink-500">{(form[k] as number) ?? 5}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={(form[k] as number) ?? 5}
        onChange={(e) => set(k, Number(e.target.value))}
        className="w-full"
      />
    </div>
  )

  return (
    <div className="px-4 py-6 space-y-4">
      <Confetti active={confetti} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto px-4 py-3 rounded-2xl text-sm font-bold text-white text-center shadow-lg transition-all ${toast.ok ? 'gradient-pink' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <p className={SECTION_LABEL}>Day {day} of 30</p>
        <h1 className="text-2xl font-bold text-gray-900">Daily Check-In</h1>
        <p className="text-sm text-gray-500 mt-0.5">{program.title}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-blush-200">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 pb-2.5 pt-1 text-sm font-bold transition-colors border-b-2 ${
                active
                  ? 'text-gradient-pink border-pink-400'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Morning ── */}
      {tab === 'morning' && (
        <div className="space-y-4">
          <button
            onClick={syncMorning}
            disabled={syncing}
            className="w-full card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform disabled:opacity-60"
          >
            <div className="w-11 h-11 gradient-pink rounded-2xl flex items-center justify-center shadow-pink-sm flex-shrink-0 text-xl">
              ⌚
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">
                {syncing ? 'Syncing…' : 'Sync Morning Biometrics'}
              </p>
              <p className="text-xs text-gray-400">HRV, sleep score, body battery & more</p>
            </div>
          </button>

          <div className="card-luxury p-5 space-y-4">
            <p className={SECTION_LABEL}>Body Metrics</p>
            <div className="flex gap-3">
              {numInput('weight_kg', 'Weight (kg)', '50.0')}
              {numInput('waist_cm', 'Waist (cm)', '68.0')}
            </div>
            {numInput('sleep_hours', 'Sleep (hours)', '8.0')}
          </div>

          <div className="card-luxury p-5 space-y-4">
            <p className={SECTION_LABEL}>How You Feel</p>
            {slider('energy', 'Energy')}
            {slider('mood', 'Mood')}
          </div>

          <div className="card-luxury p-5 space-y-4">
            <p className={SECTION_LABEL}>Body Readiness</p>
            {READINESS.map((row) => (
              <div key={String(row.key)}>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">{row.label}</label>
                <div className="flex gap-2">
                  {row.options.map((o) => {
                    const active = form[row.key] === o.value
                    return (
                      <button
                        key={o.value}
                        onClick={() => set(row.key, o.value)}
                        className={`flex-1 py-2.5 rounded-2xl text-lg active:scale-95 transition-all ${
                          active
                            ? 'gradient-pink shadow-pink-sm'
                            : 'bg-blush-50 border border-blush-200'
                        }`}
                      >
                        {o.emoji}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveMorning}
            disabled={saving}
            className="w-full gradient-pink text-white font-bold py-3.5 rounded-2xl shadow-pink-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? 'Analyzing…' : 'Save Morning ✨'}
          </button>

          {morningAI && (
            <div className="card-luxury p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: readinessColor(morningAI.readiness_label) }}
                >
                  {morningAI.readiness_label} · {morningAI.readiness_score}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{morningAI.headline}</h3>
              <p className="text-sm text-gray-600">{morningAI.summary}</p>
              <div className="bg-blush-50 rounded-2xl p-3">
                <p className="text-xs font-bold text-pink-500 mb-1">Workout Readiness</p>
                <p className="text-sm text-gray-700">{morningAI.workout_readiness}</p>
              </div>
              {morningAI.action_items?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL + ' mb-1.5'}>Action Items</p>
                  <ul className="space-y-1.5">
                    {morningAI.action_items.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-pink-400">✦</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {morningAI.key_metrics?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {morningAI.key_metrics.map((m, i) => (
                    <div key={i} className="bg-blush-50 rounded-2xl px-3 py-2">
                      <p className="text-[10px] uppercase font-bold text-gray-400">{m.label}</p>
                      <p className="text-sm font-bold text-gray-800">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Post-Activity ── */}
      {tab === 'post' && (
        <div className="space-y-4">
          <button
            onClick={syncActivity}
            disabled={syncing}
            className="w-full card-luxury p-4 flex items-center gap-3 active:scale-95 transition-transform disabled:opacity-60"
          >
            <div className="w-11 h-11 gradient-gold rounded-2xl flex items-center justify-center shadow-gold-sm flex-shrink-0 text-xl">
              ⚡
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">
                {syncing ? 'Syncing…' : 'Sync Activity Data'}
              </p>
              <p className="text-xs text-gray-400">Training load, steps & calories</p>
            </div>
          </button>

          <div className="card-luxury p-5 space-y-4">
            <p className={SECTION_LABEL}>Effort</p>
            {slider('rpe', 'RPE (perceived exertion)')}
          </div>

          <div className="card-luxury p-5 space-y-3">
            <p className={SECTION_LABEL}>How Did It Feel?</p>
            <div className="grid grid-cols-2 gap-2">
              {FEELINGS.map((f) => {
                const active = form.workout_feeling === f.value
                return (
                  <button
                    key={f.value}
                    onClick={() => set('workout_feeling', f.value)}
                    className={`py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all ${
                      active
                        ? 'gradient-pink text-white shadow-pink-sm'
                        : 'bg-blush-50 text-gray-600 border border-blush-200'
                    }`}
                  >
                    <span className="mr-1">{f.emoji}</span>
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card-luxury p-5 space-y-2">
            <p className={SECTION_LABEL}>Notes</p>
            <textarea
              value={form.workout_notes ?? ''}
              onChange={(e) => set('workout_notes', e.target.value)}
              placeholder="How was the session? Any PRs, struggles, or wins?"
              rows={3}
              className="w-full bg-blush-50 border border-blush-200 rounded-2xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-pink-300 resize-none"
            />
          </div>

          <button
            onClick={savePost}
            disabled={saving}
            className="w-full gradient-pink text-white font-bold py-3.5 rounded-2xl shadow-pink-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? 'Analyzing…' : 'Save Post-Activity ⚡'}
          </button>

          {postAI && (
            <div className="card-luxury p-5 space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold gradient-pink text-white inline-block">
                {postAI.session_verdict}
              </span>
              <p className="text-sm text-gray-600">{postAI.session_summary}</p>
              <div className="bg-blush-50 rounded-2xl p-3 space-y-2">
                <div>
                  <p className="text-xs font-bold text-pink-500">Effort</p>
                  <p className="text-sm text-gray-700">{postAI.effort_assessment}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-pink-500">Recovery Window</p>
                  <p className="text-sm text-gray-700">{postAI.recovery_window}</p>
                </div>
              </div>
              {postAI.recovery_actions?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL + ' mb-1.5'}>Recovery Actions</p>
                  <ul className="space-y-1.5">
                    {postAI.recovery_actions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-pink-400">✦</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-blush-50 rounded-2xl p-3">
                <p className="text-xs font-bold text-pink-500">Tomorrow</p>
                <p className="text-sm text-gray-700">{postAI.tomorrow_impact}</p>
              </div>
              <div className="bg-gold-100 rounded-2xl p-3">
                <p className="text-xs font-bold text-gold-600">⚠️ Watch out</p>
                <p className="text-sm text-gray-700">{postAI.watch_out}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Evening ── */}
      {tab === 'evening' && (
        <div className="space-y-4">
          <div className="card-luxury p-5 space-y-4">
            <p className={SECTION_LABEL}>Day Summary</p>
            <div className="flex gap-3">
              {numInput('steps', 'Steps', '8000', '1')}
              {numInput('calories', 'Calories', '1800', '1')}
            </div>
            {numInput('water_liters', 'Water (L)', '2.5')}
          </div>

          <div className="card-luxury p-5 space-y-3">
            <p className={SECTION_LABEL}>Nutrition Quality</p>
            <div className="grid grid-cols-4 gap-2">
              {NUTRITION.map((n) => {
                const active = form.nutrition_quality === n.value
                return (
                  <button
                    key={n.value}
                    onClick={() => set('nutrition_quality', n.value)}
                    className={`py-3 rounded-2xl font-bold text-xs active:scale-95 transition-all flex flex-col items-center gap-1 ${
                      active
                        ? 'gradient-pink text-white shadow-pink-sm'
                        : 'bg-blush-50 text-gray-600 border border-blush-200'
                    }`}
                  >
                    <span className="text-lg">{n.emoji}</span>
                    {n.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={saveEvening}
            disabled={saving}
            className="w-full gradient-pink text-white font-bold py-3.5 rounded-2xl shadow-pink-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? 'Analyzing…' : 'Save Evening 🌙'}
          </button>

          {eveningAI && (
            <div className="card-luxury p-5 space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold gradient-pink text-white inline-block">
                {eveningAI.day_verdict}
              </span>
              <p className="text-sm text-gray-600">{eveningAI.day_summary}</p>
              <div className="bg-blush-50 rounded-2xl p-3">
                <p className="text-xs font-bold text-pink-500">Sleep Target</p>
                <p className="text-sm text-gray-700">{eveningAI.sleep_target}</p>
              </div>
              {eveningAI.wind_down?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL + ' mb-1.5'}>Wind Down</p>
                  <ul className="space-y-1.5">
                    {eveningAI.wind_down.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-pink-400">✦</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-gold-100 rounded-2xl p-3">
                <p className="text-xs font-bold text-gold-600">Tomorrow</p>
                <p className="text-sm text-gray-700">{eveningAI.tomorrow_preview}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
