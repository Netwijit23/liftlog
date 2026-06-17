'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GeneratedWorkout {
  name: string
  exercises: { name: string; sets: number; reps: number; weight: number }[]
}

interface Props {
  onStartWorkout: (workout: GeneratedWorkout) => void
}

function parseWorkout(text: string): { clean: string; workout: GeneratedWorkout | null } {
  const marker = 'WORKOUT_JSON:'
  const idx = text.indexOf(marker)
  if (idx === -1) return { clean: text, workout: null }
  const clean = text.slice(0, idx).trim()
  try {
    const json = text.slice(idx + marker.length).trim()
    const workout = JSON.parse(json) as GeneratedWorkout
    return { clean, workout }
  } catch {
    return { clean, workout: null }
  }
}

export default function CoachChat({ onStartWorkout }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingWorkout, setPendingWorkout] = useState<GeneratedWorkout | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Kick off the conversation when the drawer opens
  useEffect(() => {
    if (open && messages.length === 0) {
      sendToCoach([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  async function sendToCoach(history: Message[]) {
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const { text } = await res.json()
      const { clean, workout } = parseWorkout(text)
      const assistantMsg: Message = { role: 'assistant', content: clean }
      setMessages((prev) => [...prev, assistantMsg])
      if (workout) setPendingWorkout(workout)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection issue — try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    await sendToCoach(newHistory)
  }

  function handleStartWorkout() {
    if (!pendingWorkout) return
    onStartWorkout(pendingWorkout)
    setOpen(false)
    setMessages([])
    setPendingWorkout(null)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full gradient-pink shadow-pink-lg flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Open AI Coach"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '75vh' }}
      >
        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-4 border-b border-gray-100 px-5">
          <div className="w-10 h-1 rounded-full bg-gray-200 mb-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI Coach</p>
                <p className="text-xs text-gray-400">Powered by Claude</p>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setMessages([]); setPendingWorkout(null) }} className="text-gray-300 text-xl font-light">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ height: 'calc(75vh - 160px)' }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${
                  m.role === 'user'
                    ? 'gradient-pink text-white rounded-br-sm'
                    : 'bg-blush-50 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-blush-50 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Workout card */}
          {pendingWorkout && (
            <div className="bg-white border-2 border-pink-200 rounded-2xl p-4 space-y-3">
              <p className="font-bold text-gray-900 text-sm">{pendingWorkout.name}</p>
              <div className="space-y-1.5">
                {pendingWorkout.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{ex.name}</span>
                    <span className="text-gray-400">{ex.sets} × {ex.reps} · {ex.weight}kg</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleStartWorkout}
                className="w-full gradient-pink text-white font-bold text-sm py-3 rounded-xl shadow-pink-sm active:scale-95 transition-transform"
              >
                Start This Workout →
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pb-safe pt-2 border-t border-gray-100 flex gap-2 bg-white">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach…"
            className="flex-1 bg-blush-50 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full gradient-pink flex items-center justify-center shadow-pink-sm disabled:opacity-40 active:scale-90 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 rotate-90">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
