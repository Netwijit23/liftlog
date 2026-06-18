import type { Checkin, RecoveryResult } from '@/types'

// Normalize a metric to 0-100 given sensible min/max bounds.
function norm(value: number, min: number, max: number): number {
  const pct = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, pct))
}

// Inverse normalize — higher raw value = lower score (e.g. resting HR, stress).
function normInverse(value: number, min: number, max: number): number {
  return 100 - norm(value, min, max)
}

const SORENESS_PENALTY: Record<string, number> = {
  none: 0,
  mild: 4,
  moderate: 10,
  severe: 18,
}

const JOINT_PENALTY: Record<string, number> = {
  great: 0,
  good: 0,
  ok: 4,
  achy: 10,
  painful: 18,
}

export function calcRecovery(checkin: Partial<Checkin>): RecoveryResult {
  // Weighted component scores (only count provided metrics, renormalize weights).
  const components: { score: number; weight: number }[] = []

  if (checkin.hrv != null) {
    // Typical resting HRV 20-120ms; higher is better.
    components.push({ score: norm(checkin.hrv, 20, 120), weight: 0.25 })
  }
  if (checkin.sleep_score != null) {
    components.push({ score: norm(checkin.sleep_score, 0, 100), weight: 0.2 })
  }
  if (checkin.body_battery != null) {
    components.push({ score: norm(checkin.body_battery, 0, 100), weight: 0.15 })
  }
  if (checkin.resting_hr != null) {
    // Lower resting HR is better; 40-90 bpm range.
    components.push({ score: normInverse(checkin.resting_hr, 40, 90), weight: 0.15 })
  }
  if (checkin.stress_score != null) {
    // Lower stress is better; 0-100 range.
    components.push({ score: normInverse(checkin.stress_score, 0, 100), weight: 0.1 })
  }
  if (checkin.training_readiness != null) {
    components.push({ score: norm(checkin.training_readiness, 0, 100), weight: 0.1 })
  }
  if (checkin.training_load != null) {
    // Higher load = less recovered (inverse). Typical 0-150.
    components.push({ score: normInverse(checkin.training_load, 0, 150), weight: 0.05 })
  }

  let score = 65 // neutral default when no data
  if (components.length > 0) {
    const totalWeight = components.reduce((s, c) => s + c.weight, 0)
    score = components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
  }
  score = Math.round(Math.max(0, Math.min(100, score)))

  // ── Recovery hours: base from training load ──
  const load = checkin.training_load ?? 40
  let recoveryHours: number
  if (load >= 70) recoveryHours = 16
  else if (load >= 50) recoveryHours = 24
  else if (load >= 30) recoveryHours = 36
  else recoveryHours = 48

  // Adjustments
  if (checkin.hrv != null) {
    if (checkin.hrv >= 70) recoveryHours -= 4
    else if (checkin.hrv < 40) recoveryHours += 6
  }
  if (checkin.sleep_score != null) {
    if (checkin.sleep_score >= 80) recoveryHours -= 4
    else if (checkin.sleep_score < 50) recoveryHours += 6
  }
  if (checkin.soreness) {
    recoveryHours += SORENESS_PENALTY[checkin.soreness] ?? 0
  }
  if (checkin.joint_feel) {
    recoveryHours += JOINT_PENALTY[checkin.joint_feel] ?? 0
  }
  recoveryHours = Math.max(8, Math.min(72, Math.round(recoveryHours)))

  // ── Label + color from score ──
  let label: RecoveryResult['label']
  let color: string
  if (score >= 80) {
    label = 'Optimal'
    color = '#22C55E'
  } else if (score >= 65) {
    label = 'Good'
    color = '#EAB308'
  } else if (score >= 45) {
    label = 'Moderate'
    color = '#F97316'
  } else {
    label = 'Low'
    color = '#EF4444'
  }

  return { score, recoveryHours, label, color }
}
