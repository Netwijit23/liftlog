import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const statements = [
    `create table if not exists ll_checkins (
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
    )`,
    `create table if not exists ll_challenge_profile (
      id uuid primary key default gen_random_uuid(),
      user_id text unique not null,
      challenge_start_date date,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    )`,
    `create table if not exists ll_workout_sets (
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
    )`,
    `alter table ll_checkins disable row level security`,
    `alter table ll_challenge_profile disable row level security`,
    `alter table ll_workout_sets disable row level security`,
  ]

  const errors: string[] = []
  for (const sql of statements) {
    const { error } = await Promise.resolve(supabase.rpc('exec_ddl', { sql })).catch(() => ({ error: null, data: null }))
    if (error) errors.push(error.message)
  }

  // Fallback: try direct insert to verify tables exist
  const checks = await Promise.all([
    supabase.from('ll_checkins').select('id').limit(0),
    supabase.from('ll_challenge_profile').select('id').limit(0),
    supabase.from('ll_workout_sets').select('id').limit(0),
  ])

  const tablesExist = checks.every((c) => !c.error || !c.error.message.includes('does not exist'))

  return NextResponse.json({ ok: tablesExist, errors })
}
