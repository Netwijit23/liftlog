-- Run this in your Supabase SQL editor (shares an existing project — all tables prefixed ll_)

create table if not exists ll_profile (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  name text,
  start_weight numeric,
  goal_weight numeric,
  step_goal int default 10000,
  calorie_goal int default 2000,
  created_at timestamptz default now()
);

create table if not exists ll_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  weight_kg numeric,
  waist_cm numeric,
  sleep_hours numeric,
  energy_level int,
  mood_level int,
  step_count int,
  calories int,
  workout_completed boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists ll_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists ll_workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  plan_id uuid references ll_workout_plans(id),
  plan_name text,
  sets jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Disable RLS for single-user setup
alter table ll_profile disable row level security;
alter table ll_daily_logs disable row level security;
alter table ll_workout_plans disable row level security;
alter table ll_workout_logs disable row level security;
