import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cramps, energy, bloating, mood, backPain, cravings, available } = body

  const prompt = `You are Momo's caring fitness coach. Momo is on her period today and has answered a quick check-in:

- Cramps: ${cramps} (1=none, 5=severe)
- Energy: ${energy} (1=drained, 5=normal)
- Bloating: ${bloating} (1=none, 5=very bloated)
- Mood: ${mood} (1=low/irritable, 5=good)
- Lower back pain: ${backPain} (yes/no)
- Time available: ${available} minutes

Momo's usual exercises include:
- Lower Body: Barbell Hip Thrust, Goblet Squat, Romanian Deadlift, Leg Press, Cable Kickback, Plank, Dead Bug
- Upper Body: Lat Pulldown, Dumbbell Shoulder Press, Seated Cable Row, Incline DB Chest Press, Lateral Raises, Cable Bicep Curl, Tricep Pushdown

Generate a compassionate, adapted workout plan. Rules:
- If cramps ≥ 4 or energy ≤ 2: gentle recovery session only (light stretching, walking, breathwork)
- If back pain: NO hip thrusts, NO deadlifts, NO heavy lower body — swap to seated upper body or gentle core
- Reduce sets by 1-2 and weight by 20-30% from normal
- Favour upper body and gentle movements when lower body cramps are present
- If energy is ok (≥3) and cramps mild (≤2): normal workout is fine, just slightly reduced intensity
- Always be warm and non-judgmental. Acknowledge how she feels first.
- Keep exercise names matching her usual exercises where possible (for GIF lookup)

Respond with ONLY valid JSON in this exact shape:
{
  "message": "2-3 warm encouraging sentences acknowledging how she feels and what you've planned",
  "plan_name": "short name like 'Gentle Flow Day' or 'Period-Friendly Upper'",
  "intensity": "rest" | "gentle" | "moderate" | "normal",
  "exercises": [
    { "name": "Exercise Name", "sets": 2, "reps": 12, "weight": 10, "note": "optional tip" }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text.trim()
    // Strip markdown code fences if present
    const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({
      message: "You're doing amazing just showing up. Here's a gentle session for today 💕",
      plan_name: 'Gentle Period Flow',
      intensity: 'gentle',
      exercises: [
        { name: 'Lat Pulldown', sets: 2, reps: 12, weight: 10, note: 'Seated, light weight' },
        { name: 'Dumbbell Shoulder Press', sets: 2, reps: 12, weight: 5, note: 'Slow and controlled' },
        { name: 'Cable Bicep Curl', sets: 2, reps: 15, weight: 8, note: 'Feel good movement' },
        { name: 'Dead Bug', sets: 2, reps: 10, weight: 0, note: 'Gentle core, no crunch' },
      ],
    })
  }
}
