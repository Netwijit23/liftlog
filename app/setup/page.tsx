'use client'

import { useState } from 'react'

const SQL = `-- Run this in Supabase SQL Editor → New Query → Paste → Run

create table if not exists ll_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  day_number int not null,
  date date not null,
  weight_kg numeric, waist_cm numeric,
  sleep_hours numeric, sleep_score numeric,
  energy int, mood int,
  fatigue text, soreness text, motivation text, joint_feel text,
  hrv numeric, body_battery numeric, resting_hr numeric,
  stress_score numeric, training_readiness numeric, training_load numeric,
  hrv_computed boolean default false,
  sleep_score_computed boolean default false,
  body_battery_computed boolean default false,
  resting_hr_computed boolean default false,
  stress_score_computed boolean default false,
  training_readiness_computed boolean default false,
  training_load_computed boolean default false,
  rpe int, workout_feeling text, workout_notes text,
  steps int, calories int, water_liters numeric, nutrition_quality text,
  recovery_steam boolean default false,
  recovery_sauna boolean default false,
  recovery_ice_bath boolean default false,
  recovery_mobility boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_number)
);

create table if not exists ll_challenge_profile (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  challenge_start_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ll_workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  day_number int not null,
  date date not null,
  workout_type text,
  sets jsonb not null default '[]',
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_number)
);

alter table ll_checkins disable row level security;
alter table ll_challenge_profile disable row level security;
alter table ll_workout_sets disable row level security;`

export default function SetupPage() {
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'missing'>('idle')

  async function copySQL() {
    await navigator.clipboard.writeText(SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function checkTables() {
    setStatus('checking')
    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const { ok } = await res.json()
      setStatus(ok ? 'ok' : 'missing')
    } catch {
      setStatus('missing')
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">One-Time Setup</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Database Setup</h1>
        <p className="text-sm text-gray-500 mt-1">
          The check-in, recovery, and challenge features need 3 new database tables. Run the SQL below once in your Supabase dashboard.
        </p>
      </div>

      {/* Steps */}
      <div className="card-luxury p-5 space-y-4">
        <p className="text-sm font-bold text-gray-700">Steps:</p>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Copy the SQL below</li>
          <li>Go to <span className="font-bold text-pink-500">supabase.com</span> → your project</li>
          <li>Click <span className="font-bold">SQL Editor</span> → <span className="font-bold">New Query</span></li>
          <li>Paste and click <span className="font-bold">Run</span></li>
          <li>Come back and tap "Verify Setup" below</li>
        </ol>
      </div>

      {/* SQL box */}
      <div className="card-luxury overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-blush-50 border-b border-blush-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">SQL</p>
          <button
            onClick={copySQL}
            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${copied ? 'gradient-pink text-white' : 'bg-white text-pink-500 border border-pink-200'}`}
          >
            {copied ? '✓ Copied!' : 'Copy SQL'}
          </button>
        </div>
        <pre className="px-4 py-3 text-[10px] text-gray-600 overflow-x-auto leading-relaxed">
          {SQL}
        </pre>
      </div>

      <button
        onClick={checkTables}
        disabled={status === 'checking'}
        className="w-full gradient-pink text-white font-bold py-4 rounded-3xl shadow-pink-sm active:scale-95 transition-transform disabled:opacity-60"
      >
        {status === 'checking' ? 'Checking…' : 'Verify Setup ✓'}
      </button>

      {status === 'ok' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-700">All tables created!</p>
          <p className="text-sm text-green-600 mt-0.5">You&apos;re ready to go. Head back to the app.</p>
        </div>
      )}

      {status === 'missing' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">⚠️</p>
          <p className="font-bold text-amber-700">Tables not found yet</p>
          <p className="text-sm text-amber-600 mt-0.5">Run the SQL in Supabase first, then try again.</p>
        </div>
      )}
    </div>
  )
}
