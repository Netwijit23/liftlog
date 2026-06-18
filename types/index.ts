// ── Core types for the 30-day MomoFit challenge ──────────────────────────────

export type WorkoutType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full'
  | 'rest'

// [exercise, sets, reps_str, rest_sec]
export type WorkoutSet = [string, number, string, number]

export interface ProgramDay {
  day: number
  week: number
  type: WorkoutType
  title: string
  hook: string
  calories: number
  cardio: string
  workout: WorkoutSet[]
}

export interface Checkin {
  id?: string
  user_id: string
  day_number: number
  date: string

  // Body metrics
  weight_kg: number | null
  waist_cm: number | null

  // Sleep
  sleep_hours: number | null
  sleep_score: number | null

  // Subjective morning
  energy: number | null
  mood: number | null
  fatigue: string | null
  soreness: string | null
  motivation: string | null
  joint_feel: string | null

  // Biometrics (HealthKit-style)
  hrv: number | null
  body_battery: number | null
  resting_hr: number | null
  stress_score: number | null
  training_readiness: number | null
  training_load: number | null

  // Computed flags (whether value was estimated)
  hrv_computed: boolean | null
  sleep_score_computed: boolean | null
  body_battery_computed: boolean | null
  resting_hr_computed: boolean | null
  stress_score_computed: boolean | null
  training_readiness_computed: boolean | null
  training_load_computed: boolean | null

  // Post-activity
  rpe: number | null
  workout_feeling: string | null
  workout_notes: string | null

  // Evening
  steps: number | null
  calories: number | null
  water_liters: number | null
  nutrition_quality: string | null

  // Recovery modalities
  recovery_steam: boolean | null
  recovery_sauna: boolean | null
  recovery_ice_bath: boolean | null
  recovery_mobility: boolean | null

  created_at?: string
  updated_at?: string
}

export interface RecoveryResult {
  score: number
  recoveryHours: number
  label: 'Optimal' | 'Good' | 'Moderate' | 'Low'
  color: string
}

export interface ChallengeProfile {
  user_id: string
  challenge_start_date: string | null
}

// AI analysis result shapes
export interface MorningAnalysis {
  readiness_score: number
  readiness_label: string
  headline: string
  summary: string
  workout_readiness: string
  action_items: string[]
  key_metrics: { label: string; value: string }[]
}

export interface PostActivityAnalysis {
  session_verdict: string
  session_summary: string
  effort_assessment: string
  recovery_window: string
  recovery_actions: string[]
  tomorrow_impact: string
  watch_out: string
}

export interface EveningAnalysis {
  day_verdict: string
  day_summary: string
  sleep_target: string
  wind_down: string[]
  tomorrow_preview: string
}
