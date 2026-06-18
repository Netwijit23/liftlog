import type { ProgramDay, WorkoutSet, WorkoutType } from '@/types'

// ── Exercise pools by training type ──────────────────────────────────────────
// Tuples: [exercise, sets, reps_str, rest_sec]

function legs(extra: number): WorkoutSet[] {
  return [
    ['Barbell Back Squat', 3 + extra, '8-10', 120],
    ['Romanian Deadlift', 3 + extra, '10-12', 100],
    ['Barbell Hip Thrust', 3, '12-15', 90],
    ['Walking Lunges', 3, '12 / leg', 75],
    ['Leg Press', 3, '12-15', 90],
    ['Standing Calf Raise', 3, '15-20', 60],
  ]
}

function push(extra: number): WorkoutSet[] {
  return [
    ['Barbell Bench Press', 3 + extra, '8-10', 120],
    ['Overhead Press', 3 + extra, '8-10', 100],
    ['Incline Dumbbell Press', 3, '10-12', 90],
    ['Lateral Raises', 3, '12-15', 60],
    ['Tricep Pushdown', 3, '12-15', 60],
    ['Overhead Tricep Extension', 2, '12-15', 60],
  ]
}

function pull(extra: number): WorkoutSet[] {
  return [
    ['Lat Pulldown', 3 + extra, '10-12', 100],
    ['Seated Cable Row', 3 + extra, '10-12', 100],
    ['Bent-Over Barbell Row', 3, '8-10', 100],
    ['Face Pull', 3, '15-20', 60],
    ['Dumbbell Bicep Curl', 3, '12-15', 60],
    ['Hammer Curl', 2, '12-15', 60],
  ]
}

function upper(extra: number): WorkoutSet[] {
  return [
    ['Incline Dumbbell Press', 3 + extra, '10-12', 100],
    ['Lat Pulldown', 3 + extra, '10-12', 100],
    ['Dumbbell Shoulder Press', 3, '10-12', 90],
    ['Seated Cable Row', 3, '12-15', 90],
    ['Lateral Raises', 3, '15-20', 60],
    ['Cable Bicep Curl', 3, '12-15', 60],
    ['Tricep Pushdown', 3, '12-15', 60],
  ]
}

function lower(extra: number): WorkoutSet[] {
  return [
    ['Goblet Squat', 3 + extra, '10-12', 100],
    ['Romanian Deadlift', 3 + extra, '10-12', 100],
    ['Barbell Hip Thrust', 3, '12-15', 90],
    ['Bulgarian Split Squat', 3, '10 / leg', 90],
    ['Leg Curl', 3, '12-15', 60],
    ['Cable Kickback', 3, '15 / leg', 60],
  ]
}

function full(extra: number): WorkoutSet[] {
  return [
    ['Goblet Squat', 3 + extra, '12-15', 90],
    ['Push-Up', 3, '10-15', 75],
    ['Bent-Over Dumbbell Row', 3 + extra, '12-15', 90],
    ['Barbell Hip Thrust', 3, '12-15', 75],
    ['Dumbbell Shoulder Press', 3, '12-15', 75],
    ['Plank', 3, '45-60 sec', 45],
    ['Dead Bug', 2, '12 / side', 45],
  ]
}

const REST: WorkoutSet[] = []

// ── Day metadata ─────────────────────────────────────────────────────────────

interface DayMeta {
  type: WorkoutType
  title: string
  hook: string
  calories: number
  cardio: string
}

const META: Record<WorkoutType, DayMeta> = {
  push: {
    type: 'push',
    title: 'Push Day — Chest, Shoulders & Triceps',
    hook: 'Sculpt those shoulders and build that upper-body glow ✨',
    calories: 1800,
    cardio: '10 min incline walk warm-up',
  },
  pull: {
    type: 'pull',
    title: 'Pull Day — Back & Biceps',
    hook: 'Strong back, confident posture — own the room 💪',
    calories: 1800,
    cardio: '10 min rowing machine warm-up',
  },
  legs: {
    type: 'legs',
    title: 'Leg Day — Glutes & Quads',
    hook: 'Peach day! Build the glutes, build the confidence 🍑',
    calories: 1850,
    cardio: '5 min dynamic mobility',
  },
  upper: {
    type: 'upper',
    title: 'Upper Body — Full Push & Pull',
    hook: 'Balanced upper-body strength for that toned silhouette',
    calories: 1800,
    cardio: '10 min light cardio warm-up',
  },
  lower: {
    type: 'lower',
    title: 'Lower Body — Glutes, Hams & Quads',
    hook: 'Lower-body power session — lift heavy, glow brighter',
    calories: 1850,
    cardio: '5 min dynamic mobility',
  },
  full: {
    type: 'full',
    title: 'Full Body Burn',
    hook: 'Total-body circuit to torch calories and tone everywhere 🔥',
    calories: 1800,
    cardio: '8 min HIIT finisher',
  },
  rest: {
    type: 'rest',
    title: 'Rest & Recover',
    hook: 'Recovery is where the magic happens. Rest, restore, glow 🌙',
    calories: 1450,
    cardio: '20-30 min easy walk + mobility',
  },
}

// 8-day cycle: Push / Pull / Legs / Rest / Upper / Lower / Full / Rest
const CYCLE: WorkoutType[] = [
  'push',
  'pull',
  'legs',
  'rest',
  'upper',
  'lower',
  'full',
  'rest',
]

function buildWorkout(type: WorkoutType, week: number): WorkoutSet[] {
  // Week 1-2: foundation (extra = 0). Week 3-4: intensification (+1 set).
  const extra = week >= 3 ? 1 : 0
  switch (type) {
    case 'push':
      return push(extra)
    case 'pull':
      return pull(extra)
    case 'legs':
      return legs(extra)
    case 'upper':
      return upper(extra)
    case 'lower':
      return lower(extra)
    case 'full':
      return full(extra)
    case 'rest':
      return REST
  }
}

// ── Build the full 30-day program ────────────────────────────────────────────

export const PROGRAM: ProgramDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  const week = Math.ceil(day / 7)
  const type = CYCLE[i % CYCLE.length]
  const meta = META[type]
  return {
    day,
    week,
    type,
    title: meta.title,
    hook: meta.hook,
    calories: meta.calories,
    cardio: meta.cardio,
    workout: buildWorkout(type, week),
  }
})

export function getProgramDay(day: number): ProgramDay {
  const clamped = Math.max(1, Math.min(30, day))
  return PROGRAM[clamped - 1]
}

export const TYPE_LABELS: Record<WorkoutType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full Body',
  rest: 'Rest',
}

export const TYPE_EMOJI: Record<WorkoutType, string> = {
  push: '💪',
  pull: '🪢',
  legs: '🍑',
  upper: '🙌',
  lower: '🦵',
  full: '🔥',
  rest: '🌙',
}
