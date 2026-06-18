-- 30-day MomoFit Challenge — new tables (prefixed ll_)
-- Run in the Supabase SQL editor. Existing ll_* tables are preserved.

-- ── Check-ins: one row per challenge day, holds morning/post/evening data ──
create table if not exists ll_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  day_number int not null,
  date date not null,

  -- Body metrics
  weight_kg numeric,
  waist_cm numeric,

  -- Sleep
  sleep_hours numeric,
  sleep_score numeric,

  -- Subjective morning
  energy int,
  mood int,
  fatigue text,
  soreness text,
  motivation text,
  joint_feel text,

  -- Biometrics
  hrv numeric,
  body_battery numeric,
  resting_hr numeric,
  stress_score numeric,
  training_readiness numeric,
  training_load numeric,

  -- Computed (estimated) flags
  hrv_computed boolean default false,
  sleep_score_computed boolean default false,
  body_battery_computed boolean default false,
  resting_hr_computed boolean default false,
  stress_score_computed boolean default false,
  training_readiness_computed boolean default false,
  training_load_computed boolean default false,

  -- Post-activity
  rpe int,
  workout_feeling text,
  workout_notes text,

  -- Evening
  steps int,
  calories int,
  water_liters numeric,
  nutrition_quality text,

  -- Recovery modalities
  recovery_steam boolean default false,
  recovery_sauna boolean default false,
  recovery_ice_bath boolean default false,
  recovery_mobility boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_number)
);

-- ── Challenge profile: stores the start date so we can compute "Day X of 30" ──
create table if not exists ll_challenge_profile (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  challenge_start_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── New sets-based workout logging (jsonb approach) ──
-- (ll_workout_logs already exists with a different schema; this is additive.)
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

-- Disable RLS for single-user setup
alter table ll_checkins disable row level security;
alter table ll_challenge_profile disable row level security;
alter table ll_workout_sets disable row level security;
