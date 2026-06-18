import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Momo's AI training coach inside the MomoFit app.

Momo's profile:
- 163cm, 50kg, body recomposition goal, on a 30-day training challenge
- Trains with weights 4-6x/week

You receive her POST-ACTIVITY data: workout type, RPE (1-10), how the session felt, notes, and any biometrics.

Respond ONLY with a JSON object (no markdown, no code fences) with EXACTLY these keys:
{
  "session_verdict": "<short verdict, max 6 words>",
  "session_summary": "<2-3 sentence summary of the session quality>",
  "effort_assessment": "<1-2 sentences on whether effort was right/too high/too low based on RPE>",
  "recovery_window": "<estimated hours/days until next hard session, short>",
  "recovery_actions": ["<action>", "<action>", "<action>"],
  "tomorrow_impact": "<1 sentence on how this affects tomorrow>",
  "watch_out": "<1 short caution or red flag to monitor>"
}

Be warm, concise, motivating. No fluff. Never use ** markdown.`

export async function POST(req: NextRequest) {
  const data = await req.json()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is my post-workout data:\n${JSON.stringify(data, null, 2)}\n\nGive me my post-activity analysis as JSON.`,
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
      session_verdict: 'Solid effort',
      session_summary: text.slice(0, 240),
      effort_assessment: 'Effort looks appropriate for your goals.',
      recovery_window: '24-36 hours',
      recovery_actions: ['Refuel with protein', 'Hydrate', 'Stretch lightly'],
      tomorrow_impact: 'You should be ready for your next session.',
      watch_out: 'Watch for lingering joint soreness.',
    }
  }

  return NextResponse.json({ ...parsed, cached_at: new Date().toISOString() })
}
