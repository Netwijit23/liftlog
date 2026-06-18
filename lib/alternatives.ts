// Exercise alternatives for equipment swaps / substitutions.
export const ALTERNATIVES: Record<string, string[]> = {
  'Barbell Back Squat': ['Goblet Squat', 'Leg Press', 'Dumbbell Squat'],
  'Goblet Squat': ['Barbell Back Squat', 'Bodyweight Squat', 'Leg Press'],
  'Romanian Deadlift': ['Dumbbell RDL', 'Good Morning', 'Cable Pull-Through'],
  'Barbell Hip Thrust': ['Glute Bridge', 'Cable Pull-Through', 'Single-Leg Hip Thrust'],
  'Walking Lunges': ['Reverse Lunge', 'Bulgarian Split Squat', 'Step-Up'],
  'Leg Press': ['Barbell Back Squat', 'Goblet Squat', 'Hack Squat'],
  'Standing Calf Raise': ['Seated Calf Raise', 'Single-Leg Calf Raise', 'Calf Press on Leg Press'],
  'Barbell Bench Press': ['Dumbbell Bench Press', 'Push-Up', 'Machine Chest Press'],
  'Overhead Press': ['Dumbbell Shoulder Press', 'Arnold Press', 'Machine Shoulder Press'],
  'Incline Dumbbell Press': ['Incline Barbell Press', 'Incline Machine Press', 'Push-Up (feet elevated)'],
  'Lateral Raises': ['Cable Lateral Raise', 'Machine Lateral Raise', 'Upright Row'],
  'Tricep Pushdown': ['Overhead Tricep Extension', 'Dips', 'Close-Grip Push-Up'],
  'Overhead Tricep Extension': ['Tricep Pushdown', 'Skull Crusher', 'Dips'],
  'Lat Pulldown': ['Pull-Up', 'Assisted Pull-Up', 'Straight-Arm Pulldown'],
  'Seated Cable Row': ['Bent-Over Barbell Row', 'Dumbbell Row', 'Machine Row'],
  'Bent-Over Barbell Row': ['Dumbbell Row', 'Seated Cable Row', 'T-Bar Row'],
  'Bent-Over Dumbbell Row': ['Seated Cable Row', 'Bent-Over Barbell Row', 'Machine Row'],
  'Face Pull': ['Reverse Pec Deck', 'Rear Delt Fly', 'Band Pull-Apart'],
  'Dumbbell Bicep Curl': ['Cable Bicep Curl', 'Barbell Curl', 'Hammer Curl'],
  'Cable Bicep Curl': ['Dumbbell Bicep Curl', 'Barbell Curl', 'Preacher Curl'],
  'Hammer Curl': ['Dumbbell Bicep Curl', 'Cable Rope Curl', 'Reverse Curl'],
  'Dumbbell Shoulder Press': ['Overhead Press', 'Arnold Press', 'Machine Shoulder Press'],
  'Bulgarian Split Squat': ['Reverse Lunge', 'Walking Lunges', 'Step-Up'],
  'Leg Curl': ['Romanian Deadlift', 'Nordic Curl', 'Stability Ball Curl'],
  'Cable Kickback': ['Glute Bridge', 'Donkey Kick', 'Single-Leg Hip Thrust'],
  'Push-Up': ['Barbell Bench Press', 'Dumbbell Bench Press', 'Machine Chest Press'],
  'Plank': ['Dead Bug', 'Hollow Hold', 'Ab Wheel Rollout'],
  'Dead Bug': ['Plank', 'Bird Dog', 'Hollow Hold'],
}

export function getAlternatives(exercise: string): string[] {
  return ALTERNATIVES[exercise] ?? []
}
