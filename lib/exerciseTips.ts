const TIPS: [RegExp, string][] = [
  [/hip thrust/i, 'Drive through heels · squeeze glutes hard at the top · chin tucked'],
  [/goblet squat|squat/i, 'Knees track over toes · chest up · hit depth below parallel'],
  [/romanian|rdl/i, 'Hinge at hips · soft knee · feel the hamstring stretch on the way down'],
  [/deadlift/i, 'Brace core before you pull · bar stays close to shins the whole way up'],
  [/leg press/i, 'Full range · don\'t lock knees at the top · feet shoulder-width'],
  [/kickback/i, 'Don\'t swing · squeeze the glute at full extension · slow on the way back'],
  [/plank/i, 'Squeeze glutes · abs · quads all at once · breathe steadily'],
  [/dead bug/i, 'Press lower back flat to floor throughout · slow and controlled'],
  [/lat pulldown/i, 'Pull elbows down to pockets · slight lean back · chest proud'],
  [/shoulder press|dumbbell press/i, 'Core tight · don\'t arch lower back · full extension overhead'],
  [/cable row|seated row/i, 'Elbows close to body · squeeze shoulder blades together at the end'],
  [/chest press|incline/i, 'Control the descent 2 seconds down · full stretch at the bottom'],
  [/lateral raise/i, 'Lead with elbows · slight bend in arm · stop at shoulder height'],
  [/bicep curl|curl/i, 'Full extension at the bottom · don\'t swing · isolate the bicep'],
  [/tricep|pushdown/i, 'Elbows pinned to sides · fully extend · squeeze at the bottom'],
  [/row/i, 'Retract shoulder blade first · then pull · control the return'],
]

export function getExerciseTip(name: string): string {
  for (const [pattern, tip] of TIPS) {
    if (pattern.test(name)) return tip
  }
  return 'Focus on the muscle working · control both directions of the movement'
}
