import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { USER_ID } from '@/lib/user'

export const dynamic = 'force-dynamic'

// Single-user app, RLS disabled — service role falls back to anon key.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Fields we generate synthetic ("computed") biometric values for when syncing.
const MORNING_FIELDS = [
  'hrv',
  'sleep_score',
  'body_battery',
  'resting_hr',
  'stress_score',
  'training_readiness',
] as const

const ACTIVITY_FIELDS = ['training_load', 'steps', 'calories'] as const

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

export async function POST(req: NextRequest) {
  const { mode, data, day_number } = (await req.json()) as {
    mode: 'morning' | 'activity'
    data?: Record<string, number | string>
    day_number: number
  }

  const today = new Date().toISOString().split('T')[0]
  // Start from any explicitly supplied data
  const payload: Record<string, unknown> = {
    user_id: USER_ID,
    day_number,
    date: today,
    updated_at: new Date().toISOString(),
    ...(data ?? {}),
  }

  const updated: string[] = []

  if (mode === 'morning') {
    // Synthesize plausible morning biometrics (HealthKit stand-in).
    const synth: Record<string, number> = {
      hrv: rand(45, 85),
      sleep_score: rand(60, 92),
      body_battery: rand(55, 90),
      resting_hr: rand(52, 66),
      stress_score: rand(20, 55),
      training_readiness: rand(60, 90),
    }
    for (const f of MORNING_FIELDS) {
      if (payload[f] == null) {
        payload[f] = synth[f]
        payload[`${f}_computed`] = true
      }
      updated.push(f)
    }
  } else if (mode === 'activity') {
    const synth: Record<string, number> = {
      training_load: rand(35, 85),
      steps: rand(4000, 12000),
      calories: rand(1500, 2200),
    }
    for (const f of ACTIVITY_FIELDS) {
      if (payload[f] == null) {
        payload[f] = synth[f]
        if (f === 'training_load') payload['training_load_computed'] = true
      }
      updated.push(f)
    }
  }

  const { error } = await getSupabase()
    .from('ll_checkins')
    .upsert(payload, { onConflict: 'user_id,day_number' })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated_fields: updated })
}
