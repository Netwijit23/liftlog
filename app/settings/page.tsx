'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'

interface Profile {
  name: string
  start_weight: string
  goal_weight: string
  step_goal: string
  calorie_goal: string
}

const defaultProfile: Profile = {
  name: '',
  start_weight: '',
  goal_weight: '',
  step_goal: '10000',
  calorie_goal: '2000',
}

function Field({ label, value, onChange, type = 'text', placeholder = '', suffix = '' }: {
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
          className="w-full bg-blush-50 rounded-2xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-pink-400 transition-all pr-14"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('ll_profile').select('*').eq('user_id', USER_ID).maybeSingle()
    if (data) {
      setProfile({
        name: data.name ?? '',
        start_weight: data.start_weight?.toString() ?? '',
        goal_weight: data.goal_weight?.toString() ?? '',
        step_goal: data.step_goal?.toString() ?? '10000',
        calorie_goal: data.calorie_goal?.toString() ?? '2000',
      })
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const set = (key: keyof Profile) => (val: string) => setProfile((p) => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('ll_profile').upsert({
      user_id: USER_ID,
      name: profile.name || null,
      start_weight: profile.start_weight ? Number(profile.start_weight) : null,
      goal_weight: profile.goal_weight ? Number(profile.goal_weight) : null,
      step_goal: profile.step_goal ? Number(profile.step_goal) : 10000,
      calorie_goal: profile.calorie_goal ? Number(profile.calorie_goal) : 2000,
    }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const goalWeight = profile.goal_weight ? Number(profile.goal_weight) : null
  const startWeight = profile.start_weight ? Number(profile.start_weight) : null
  const diffKg = startWeight && goalWeight ? Math.abs(startWeight - goalWeight) : null

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Goal summary */}
      {startWeight && goalWeight && (
        <div className="gradient-pink rounded-3xl p-5 text-white">
          <p className="text-sm font-medium opacity-80">Your goal</p>
          <p className="text-2xl font-bold mt-1">
            {startWeight} → {goalWeight} kg
          </p>
          <p className="text-sm opacity-80 mt-0.5">
            {diffKg} kg to {goalWeight < startWeight ? 'lose' : 'gain'}
          </p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 shadow-pink-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Profile</h2>
        <Field label="Your name" value={profile.name} onChange={set('name')} placeholder="Alex" />
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-pink-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Weight Goals</h2>
        <Field
          label="Starting weight" value={profile.start_weight} onChange={set('start_weight')}
          type="number" placeholder="85.0" suffix="kg"
        />
        <Field
          label="Goal weight" value={profile.goal_weight} onChange={set('goal_weight')}
          type="number" placeholder="75.0" suffix="kg"
        />
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-pink-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Daily Targets</h2>
        <Field
          label="Step goal" value={profile.step_goal} onChange={set('step_goal')}
          type="number" placeholder="10000" suffix="steps"
        />
        <Field
          label="Calorie goal" value={profile.calorie_goal} onChange={set('calorie_goal')}
          type="number" placeholder="2000" suffix="kcal"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gradient-pink text-white font-bold text-base py-4 rounded-3xl shadow-lg shadow-pink-md active:scale-95 transition-all disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      <div className="text-center text-xs text-gray-300 pb-2">
        Liftlog v0.1 · Single-user mode
      </div>
    </div>
  )
}
