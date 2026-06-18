'use client'

import { useState } from 'react'

const SECTION_LABEL = 'text-xs font-bold uppercase tracking-widest text-gray-400'

const MACROS = {
  training: { protein: 140, carbs: 180, fat: 60, kcal: 1800, water: 2.5 },
  rest: { protein: 140, carbs: 100, fat: 50, kcal: 1450, water: 2.0 },
}

const MACRO_BARS = [
  { key: 'protein', label: 'Protein', unit: 'g', color: 'linear-gradient(90deg,#F472B6,#DB2777)', max: 160 },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'linear-gradient(90deg,#FDE68A,#F59E0B)', max: 200 },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'linear-gradient(90deg,#C4B5FD,#8B5CF6)', max: 80 },
  { key: 'kcal', label: 'Calories', unit: 'kcal', color: 'linear-gradient(90deg,#93C5FD,#3B82F6)', max: 2000 },
] as const

const MEALS = [
  {
    title: 'Pre-Workout',
    timing: '~2h before',
    emoji: '🥣',
    desc: 'Oats + whey protein + banana',
    detail: 'Slow carbs and protein to fuel your session.',
  },
  {
    title: 'Post-Workout',
    timing: 'within 1h',
    emoji: '🍚',
    desc: 'Jasmine rice + grilled chicken + veg',
    detail: 'Replenish glycogen and kick-start muscle repair.',
  },
  {
    title: 'Dinner',
    timing: 'evening (light)',
    emoji: '🥗',
    desc: 'Salmon or tofu + greens + olive oil',
    detail: 'Light, protein-forward to support overnight recovery.',
  },
]

export default function MealsPage() {
  const [mode, setMode] = useState<'training' | 'rest'>('training')
  const m = MACROS[mode]

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>

      {/* Toggle */}
      <div className="flex gap-2 bg-blush-100 p-1 rounded-2xl">
        {(['training', 'rest'] as const).map((mo) => (
          <button
            key={mo}
            onClick={() => setMode(mo)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === mo ? 'gradient-pink text-white shadow-pink-sm' : 'text-pink-500'
            }`}
          >
            {mo === 'training' ? '💪 Training Day' : '🌙 Rest Day'}
          </button>
        ))}
      </div>

      {/* Macros */}
      <div className="card-luxury p-5 space-y-4">
        <p className={SECTION_LABEL}>Daily Targets</p>
        {MACRO_BARS.map((bar) => {
          const val = m[bar.key as keyof typeof m] as number
          const pct = Math.min(100, (val / bar.max) * 100)
          return (
            <div key={bar.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-600">{bar.label}</span>
                <span className="font-bold text-gray-900">
                  {val}
                  {bar.unit}
                </span>
              </div>
              <div className="h-3 rounded-full bg-blush-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bar.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Hydration */}
      <div className="card-luxury p-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-blush-50">💧</div>
        <div>
          <p className="font-bold text-gray-900">Hydration Target</p>
          <p className="text-sm text-gray-500">
            {m.water}L on {mode === 'training' ? 'training' : 'rest'} days
          </p>
        </div>
      </div>

      {/* Meal timing */}
      <p className={SECTION_LABEL + ' pt-1'}>Meal Timing</p>
      {MEALS.map((meal) => (
        <div key={meal.title} className="card-luxury p-5 flex gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-blush-50 flex-shrink-0">
            {meal.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">{meal.title}</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-pink-400 bg-blush-50 px-2 py-0.5 rounded-full">
                {meal.timing}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-1">{meal.desc}</p>
            <p className="text-xs text-gray-400 mt-0.5">{meal.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
