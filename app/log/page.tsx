'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'

type Tab = 'morning' | 'evening'

interface LogData {
  weight_kg: string
  waist_cm: string
  sleep_hours: number
  energy_level: number
  mood_level: number
  step_count: string
  calories: string
  workout_completed: boolean
  notes: string
}

const defaultLog: LogData = {
  weight_kg: '',
  waist_cm: '',
  sleep_hours: 7,
  energy_level: 7,
  mood_level: 7,
  step_count: '',
  calories: '',
  workout_completed: false,
  notes: '',
}

function SliderField({ label, value, onChange, min = 1, max = 10, color = '#FF6B00' }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; color?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={0.5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-xs text-gray-300">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', suffix = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#F5F5F7] rounded-2xl px-4 py-3 text-gray-900 font-medium text-base outline-none focus:ring-2 focus:ring-orange-400 transition-all pr-12"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LogPage() {
  const [tab, setTab] = useState<Tab>('morning')
  const [log, setLog] = useState<LogData>(defaultLog)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const loadLog = useCallback(async () => {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('date', today)
      .single()
    if (data) {
      setLog({
        weight_kg: data.weight_kg?.toString() ?? '',
        waist_cm: data.waist_cm?.toString() ?? '',
        sleep_hours: data.sleep_hours ?? 7,
        energy_level: data.energy_level ?? 7,
        mood_level: data.mood_level ?? 7,
        step_count: data.step_count?.toString() ?? '',
        calories: data.calories?.toString() ?? '',
        workout_completed: data.workout_completed ?? false,
        notes: data.notes ?? '',
      })
    }
  }, [supabase, today])

  useEffect(() => { loadLog() }, [loadLog])

  const set = (key: keyof LogData) => (val: string | number | boolean) =>
    setLog((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('daily_logs').upsert({
      user_id: USER_ID,
      date: today,
      weight_kg: log.weight_kg ? Number(log.weight_kg) : null,
      waist_cm: log.waist_cm ? Number(log.waist_cm) : null,
      sleep_hours: log.sleep_hours,
      energy_level: log.energy_level,
      mood_level: log.mood_level,
      step_count: log.step_count ? Number(log.step_count) : null,
      calories: log.calories ? Number(log.calories) : null,
      workout_completed: log.workout_completed,
      notes: log.notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Log</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 flex shadow-sm">
        {(['morning', 'evening'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              tab === t ? 'gradient-orange text-white shadow' : 'text-gray-400'
            }`}
          >
            {t === 'morning' ? '☀️ Morning' : '🌙 Evening'}
          </button>
        ))}
      </div>

      {tab === 'morning' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Body Metrics</h2>
            <InputField
              label="Weight" value={log.weight_kg} onChange={set('weight_kg') as (v: string) => void}
              type="number" placeholder="75.0" suffix="kg"
            />
            <InputField
              label="Waist (weekly)" value={log.waist_cm} onChange={set('waist_cm') as (v: string) => void}
              type="number" placeholder="85.0" suffix="cm"
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recovery</h2>
            <SliderField
              label="Sleep" value={log.sleep_hours}
              onChange={set('sleep_hours') as (v: number) => void}
              min={3} max={12} color="#3B82F6"
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Wellbeing</h2>
            <SliderField
              label="Energy ⚡" value={log.energy_level}
              onChange={set('energy_level') as (v: number) => void}
            />
            <SliderField
              label="Mood 😊" value={log.mood_level}
              onChange={set('mood_level') as (v: number) => void}
              color="#8B5CF6"
            />
          </div>
        </div>
      )}

      {tab === 'evening' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Activity</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Workout completed</p>
                <p className="text-xs text-gray-400">Did you train today?</p>
              </div>
              <button
                onClick={() => set('workout_completed')(!log.workout_completed)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  log.workout_completed ? 'gradient-orange' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  log.workout_completed ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <InputField
              label="Steps" value={log.step_count} onChange={set('step_count') as (v: string) => void}
              type="number" placeholder="8000" suffix="steps"
            />
            <InputField
              label="Calories" value={log.calories} onChange={set('calories') as (v: string) => void}
              type="number" placeholder="2000" suffix="kcal"
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Notes</h2>
            <textarea
              value={log.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="How did the day go? Any observations..."
              rows={4}
              className="w-full bg-[#F5F5F7] rounded-2xl px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none transition-all"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gradient-orange text-white font-bold text-base py-4 rounded-3xl shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Log'}
      </button>
    </div>
  )
}
