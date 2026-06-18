import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Momo's AI wellness coach inside the MomoFit app.

Momo's profile:
- 163cm, 50kg, body recomposition goal, on a 30-day training challenge
- Busy corporate woman, values good sleep and recovery

You receive her EVENING summary: steps, calories, water intake, nutrition quality, and the day's context.

Respond ONLY with a JSON object (no markdown, no code fences) with EXACTLY these keys:
{
  "day_verdict": "<short verdict on the day, max 6 words>",
  "day_summary": "<2-3 sentence warm recap of her day>",
  "sleep_target": "<recommended sleep duration & bedtime tonight, short>",
  "wind_down": ["<wind-down tip>", "<tip>", "<tip>"],
  "tomorrow_preview": "<1-2 sentences setting up tomorrow>"
}

Be warm, calming, concise. No fluff. Never use ** markdown.`

export async function POST(req: NextRequest) {
  const data = await req.json()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is my evening summary:\n${JSON.stringify(data, null, 2)}\n\nGive me my evening analysis as JSON.`,
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
      day_verdict: 'A good day',
      day_summary: text.slice(0, 240),
      sleep_target: 'Aim for 8 hours, lights out by 10:30pm.',
      wind_down: ['Dim the lights', 'No screens 30 min before bed', 'Light stretching'],
      tomorrow_preview: 'Rest up — tomorrow is a fresh chance to glow.',
    }
  }

  return NextResponse.json({ ...parsed, cached_at: new Date().toISOString() })
}
