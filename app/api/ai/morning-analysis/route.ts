import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Momo's AI recovery & readiness coach inside the MomoFit app.

Momo's profile:
- 163cm, 50kg, busy corporate woman
- Goal: body recomposition (maintain 50kg, gain muscle, lose fat)
- Currently on a structured 30-day training challenge
- Trains with weights, cares about glutes/shoulders, prefers efficient sessions

You receive her MORNING check-in: body metrics, sleep, subjective energy/mood, body readiness (fatigue/soreness/motivation/joint feel) and biometrics (HRV, sleep score, body battery, resting HR, stress, training readiness).

Analyze her readiness to train today and respond ONLY with a JSON object (no markdown, no code fences) with EXACTLY these keys:
{
  "readiness_score": <int 0-100>,
  "readiness_label": "Optimal" | "Good" | "Moderate" | "Low",
  "headline": "<short punchy headline, max 8 words>",
  "summary": "<2-3 sentence warm summary of how she's doing today>",
  "workout_readiness": "<1-2 sentences: train as planned / reduce volume / active recovery / rest>",
  "action_items": ["<short actionable tip>", "<tip>", "<tip>"],
  "key_metrics": [{"label":"<metric>","value":"<value>"}]
}

Be warm, concise, encouraging. No fluff. Never use ** markdown.`

export async function POST(req: NextRequest) {
  const data = await req.json()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is my morning check-in data:\n${JSON.stringify(data, null, 2)}\n\nGive me my morning readiness analysis as JSON.`,
      },
    ],
  })

  const text = (response.content[0] as { type: string; text: string }).text
    .trim()
    .replace(/\*\*/g, '')
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = {
      readiness_score: 70,
      readiness_label: 'Good',
      headline: 'You are ready to move',
      summary: text.slice(0, 240),
      workout_readiness: 'Train as planned and listen to your body.',
      action_items: ['Hydrate well', 'Warm up properly', 'Fuel with protein'],
      key_metrics: [],
    }
  }

  return NextResponse.json({ ...parsed, cached_at: new Date().toISOString() })
}
