import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Momo's personal AI fitness coach inside her MomoFit app.

Momo's profile:
- 163cm, 50kg, busy corporate woman, trains 2-3x per week
- Goal: body recomposition — maintain 50kg weight, gain muscle, reduce fat
- Maintenance calories ~1,600 kcal, protein target 100-110g/day
- Her two saved plans: Day A (Lower Body & Core) and Day B (Upper Body)
- Day A: Barbell Hip Thrust, Goblet Squat, Romanian Deadlift, Leg Press, Cable Kickback, Plank, Dead Bug
- Day B: Lat Pulldown, Dumbbell Shoulder Press, Seated Cable Row, Incline DB Chest Press, Lateral Raises, Cable Bicep Curl, Tricep Pushdown

Your job when chatting:
1. Ask 1-2 short questions to understand how she's feeling today and what she wants to target (energy, soreness, time available, mood)
2. Then recommend either Day A, Day B, a shortened version, or a custom session based on her answers
3. When you're ready to generate a workout, output EXACTLY this JSON block at the end of your message (no code fences, just the raw JSON after the text):

WORKOUT_JSON:{"name":"...","exercises":[{"name":"...","sets":3,"reps":12,"weight":20}]}

Rules for the JSON:
- "name" should be something like "Quick Upper Focus" or "Full Lower Body"
- weight is in kg, use sensible defaults (hip thrust 20kg, squat 12kg, deadlift 15kg, lat pulldown 15kg, shoulder press 8kg, etc.)
- Only include WORKOUT_JSON when you have enough info to make a real recommendation
- Keep all messages short and conversational — max 3 sentences
- Be warm but efficient. She's busy. No fluff.`

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  // Claude requires at least one message; inject a starter when the chat is fresh
  const chatMessages = messages.length > 0
    ? messages
    : [{ role: 'user' as const, content: "Hi, I want to plan my workout for today." }]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM,
    messages: chatMessages,
  })

  const text = (response.content[0] as { type: string; text: string }).text
    .trim()
    .replace(/\*\*/g, '')
  return NextResponse.json({ text })
}
