'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'
import { getExerciseTip } from '@/lib/exerciseTips'
import { ChevronLeft, X, SkipForward, Check, Ban, Plus, Minus, Trash2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface PlanExercise {
  id: string
  name: string
  defaultSets: number
  defaultReps: number
  defaultWeight: number
}

interface WorkoutPlan {
  id: string
  name: string
  exercises: PlanExercise[]
}

interface SetLog {
  weight: number
  reps: number
  done: boolean
}

interface ExerciseLog {
  id: string
  name: string
  sets: SetLog[]
  skipped?: boolean
}

interface ExHistory {
  exerciseName: string
  sets: { reps: number; weight: number }[]
  date: string
}

type SessionPhase = 'exercise' | 'rest' | 'summary'

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

function suggestRest(reps: number): number {
  if (reps >= 15) return 60
  if (reps >= 10) return 75
  return 90
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const supabase = createClient()

  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newExercises, setNewExercises] = useState([
    { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
  ])

  const [session, setSession] = useState<{
    planId: string; planName: string; exercises: ExerciseLog[]
  } | null>(null)
  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('exercise')
  const [restLeft, setRestLeft] = useState(90)
  const [restTotal, setRestTotal] = useState(90)
  const [suggestedRest, setSuggestedRest] = useState(90)
  const restEndRef = useRef(0)

  const [curWeight, setCurWeight] = useState('')
  const [curReps, setCurReps] = useState('')

  const [history, setHistory] = useState<ExHistory[]>([])
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [newPR, setNewPR] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Period mode
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [periodForm, setPeriodForm] = useState({ cramps: 2, energy: 3, bloating: 2, mood: 3, backPain: 'no', available: '45' })
  const [periodLoading, setPeriodLoading] = useState(false)
  const [periodPlan, setPeriodPlan] = useState<{
    message: string; plan_name: string; intensity: string
    exercises: { name: string; sets: number; reps: number; weight: number; note?: string }[]
  } | null>(null)

  useEffect(() => {
    document.body.style.overflow = showPeriodModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showPeriodModal])

  const loadPlans = useCallback(async () => {
    const { data } = await supabase.from('ll_workout_plans').select('*').eq('user_id', USER_ID).order('created_at')
    if (data) setPlans(data as WorkoutPlan[])
  }, [supabase])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from('ll_workout_logs').select('*').eq('user_id', USER_ID).order('date', { ascending: false }).limit(60)
    if (!data) return
    const h: ExHistory[] = []
    const prMap: Record<string, number> = {}
    for (const log of data) {
      for (const ex of (log.sets as { exerciseName: string; sets: { reps: number; weight: number }[] }[])) {
        h.push({ exerciseName: ex.exerciseName, sets: ex.sets, date: log.date })
        for (const s of ex.sets) {
          const rm = epley(s.weight, s.reps)
          if (!prMap[ex.exerciseName] || rm > prMap[ex.exerciseName]) prMap[ex.exerciseName] = rm
        }
      }
    }
    setHistory(h)
    setPrs(prMap)
  }, [supabase])

  useEffect(() => { loadPlans(); loadHistory() }, [loadPlans, loadHistory])

  // Rest timer using absolute end time (survives backgrounding)
  useEffect(() => {
    if (phase !== 'rest') return
    const tick = () => {
      const left = Math.max(0, Math.round((restEndRef.current - Date.now()) / 1000))
      setRestLeft(left)
      if (left === 0) setPhase('exercise')
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [phase])

  function startRest(reps: number) {
    const s = suggestRest(reps)
    setSuggestedRest(s)
    setRestTotal(s)
    restEndRef.current = Date.now() + s * 1000
    setRestLeft(s)
    setPhase('rest')
  }

  function adjustRest(delta: number) {
    const newTotal = Math.max(15, restTotal + delta)
    setRestTotal(newTotal)
    restEndRef.current = restEndRef.current + delta * 1000
    setRestLeft(l => Math.max(1, l + delta))
  }

  function initSession(planId: string, planName: string, exercises: ExerciseLog[]) {
    setSession({ planId, planName, exercises })
    setExIdx(0); setSetIdx(0); setPhase('exercise')
    setCurWeight(String(exercises[0].sets[0].weight || ''))
    setCurReps(String(exercises[0].sets[0].reps || ''))
    setNewPR(null)
  }

  function startSession(plan: WorkoutPlan) {
    const exercises: ExerciseLog[] = plan.exercises.map(ex => ({
      id: ex.id, name: ex.name,
      sets: Array.from({ length: ex.defaultSets }, () => ({ weight: ex.defaultWeight, reps: ex.defaultReps, done: false })),
    }))
    initSession(plan.id, plan.name, exercises)
  }

  function goBack() {
    if (!session) return
    if (setIdx > 0) {
      const prev = setIdx - 1
      setSetIdx(prev)
      setCurWeight(String(session.exercises[exIdx].sets[prev].weight || ''))
      setCurReps(String(session.exercises[exIdx].sets[prev].reps || ''))
      setPhase('exercise')
      return
    }
    if (exIdx > 0) {
      const prevEx = exIdx - 1
      const lastSet = session.exercises[prevEx].sets.length - 1
      setExIdx(prevEx); setSetIdx(lastSet)
      setCurWeight(String(session.exercises[prevEx].sets[lastSet].weight || ''))
      setCurReps(String(session.exercises[prevEx].sets[lastSet].reps || ''))
      setPhase('exercise')
      return
    }
    cancelSession()
  }

  function skipExercise() {
    if (!session) return
    const ex = session.exercises[exIdx]
    const remaining = session.exercises.filter((_, i) => i !== exIdx)
    const reordered = [...remaining, { ...ex, skipped: true }]
    setSession({ ...session, exercises: reordered })
    if (remaining.length === 0) { setPhase('summary'); return }
    const nextIdx = exIdx < remaining.length ? exIdx : 0
    setExIdx(nextIdx); setSetIdx(0)
    setCurWeight(String(remaining[nextIdx].sets[0].weight || ''))
    setCurReps(String(remaining[nextIdx].sets[0].reps || ''))
  }

  function completeSet() {
    if (!session) return
    const w = parseFloat(curWeight) || 0
    const r = parseInt(curReps) || 0

    const updated = session.exercises.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { weight: w, reps: r, done: true } : s) }
        : ex
    )
    setSession({ ...session, exercises: updated })

    const exName = session.exercises[exIdx].name
    const rm = epley(w, r)
    if (r > 0 && w > 0 && (!prs[exName] || rm > prs[exName])) {
      if (prs[exName]) { setNewPR(exName); setTimeout(() => setNewPR(null), 3000) }
      setPrs(p => ({ ...p, [exName]: rm }))
    }

    const ex = updated[exIdx]
    const nextSet = setIdx + 1
    if (nextSet < ex.sets.length) {
      setSetIdx(nextSet)
      setCurWeight(String(ex.sets[nextSet].weight || ''))
      setCurReps(String(ex.sets[nextSet].reps || ''))
      startRest(ex.sets[nextSet].reps)
    } else {
      const nextEx = exIdx + 1
      if (nextEx < updated.length) {
        setExIdx(nextEx); setSetIdx(0)
        setCurWeight(String(updated[nextEx].sets[0].weight || ''))
        setCurReps(String(updated[nextEx].sets[0].reps || ''))
        startRest(updated[nextEx].sets[0].reps)
      } else {
        setPhase('summary')
      }
    }
  }

  async function saveWorkout() {
    if (!session) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const sets = session.exercises.map(ex => ({
      exerciseName: ex.name,
      sets: ex.sets.filter(s => s.done).map(({ weight, reps }) => ({ weight, reps })),
    }))
    const { error: logErr } = await supabase.from('ll_workout_logs').insert({
      user_id: USER_ID, date: today, plan_id: session.planId, plan_name: session.planName, sets,
    })
    const { error: dailyErr } = await supabase.from('ll_daily_logs').upsert({
      user_id: USER_ID, date: today, workout_completed: true, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
    if (logErr || dailyErr) { setSaveError('Save failed — check your connection and try again.'); setSaving(false); return }
    await loadHistory()
    setSaving(false); setSaveSuccess(true)
    setTimeout(() => { setSaveSuccess(false); setSession(null); setPhase('exercise') }, 1800)
  }

  function cancelSession() {
    setSession(null); setPhase('exercise')
  }

  async function savePlan() {
    if (!newPlanName.trim()) return
    const exs = newExercises.filter(e => e.name.trim()).map(e => ({ id: crypto.randomUUID(), ...e }))
    await supabase.from('ll_workout_plans').insert({ user_id: USER_ID, name: newPlanName, exercises: exs })
    setNewPlanName(''); setNewExercises([{ name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])
    setShowNewPlan(false); loadPlans()
  }

  async function generatePeriodPlan() {
    setPeriodLoading(true); setPeriodPlan(null)
    try {
      const res = await fetch('/api/ai/period-workout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(periodForm) })
      setPeriodPlan(await res.json())
    } catch {
      setPeriodPlan({ message: "You showed up and that's everything 💕 Here's something gentle for today.", plan_name: 'Gentle Period Flow', intensity: 'gentle', exercises: [{ name: 'Lat Pulldown', sets: 2, reps: 12, weight: 10, note: 'Light, seated' }, { name: 'Dumbbell Shoulder Press', sets: 2, reps: 12, weight: 5 }, { name: 'Dead Bug', sets: 2, reps: 10, weight: 0, note: 'Gentle core' }] })
    }
    setPeriodLoading(false)
  }

  function startPeriodSession() {
    if (!periodPlan) return
    const exercises: ExerciseLog[] = periodPlan.exercises.map(ex => ({ id: crypto.randomUUID(), name: ex.name, sets: Array.from({ length: ex.sets }, () => ({ weight: ex.weight, reps: ex.reps, done: false })) }))
    initSession('period', periodPlan.plan_name, exercises)
    setShowPeriodModal(false); setPeriodPlan(null)
  }

  // ── Active session ─────────────────────────────────────────────────────────

  if (session) {
    const ex = session.exercises[exIdx]
    const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0)
    const doneSets = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)
    const lastSession = history.find(h => h.exerciseName === ex?.name)
    const best1RM = prs[ex?.name ?? '']
    const tip = getExerciseTip(ex?.name ?? '')

    // ── Summary ────────────────────────────────────────────────────────────
    if (phase === 'summary') {
      const totalVol = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).reduce((b, s) => b + s.weight * s.reps, 0), 0)
      const best1RMs = session.exercises.map(e => {
        const done = e.sets.filter(s => s.done && s.weight && s.reps)
        if (!done.length) return null
        const top = done.reduce((best, s) => { const rm = epley(s.weight, s.reps); return rm > best ? rm : best }, 0)
        return { name: e.name, orm: Math.round(top) }
      }).filter(Boolean)

      return (
        <div className="min-h-screen bg-black flex flex-col px-6 pt-16 pb-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#F472B6' }}>Workout complete</p>
            <h1 className="text-white text-3xl font-bold tracking-tight">{session.planName}</h1>
            <p className="text-white/30 text-sm mt-1">{session.exercises.length} exercises · {doneSets} sets · {(totalVol / 1000).toFixed(1)}t vol</p>
          </div>

          {best1RMs.length > 0 && (
            <div className="mb-6">
              <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider mb-2">Est. 1RM today</p>
              <div className="space-y-2">
                {best1RMs.map(e => e && (
                  <div key={e.name} className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-white/70 text-xs">{e.name}</span>
                    <span className="text-white font-bold text-sm">{e.orm} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 space-y-2">
            <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider mb-2">Session log</p>
            {session.exercises.map(e => {
              const done = e.sets.filter(s => s.done)
              if (!done.length) return null
              return (
                <div key={e.id} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-white/80 text-xs font-semibold mb-2">{e.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {done.map((s, i) => (
                      <span key={i} className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(244,114,182,0.15)', color: '#F472B6' }}>
                        {s.weight}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {saveError && (
            <div className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{saveError}</div>
          )}

          <div className="mt-auto space-y-3">
            <button onClick={() => { setSaveError(null); saveWorkout() }} disabled={saving || saveSuccess}
              className="w-full text-white rounded-2xl py-4 font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)', boxShadow: '0 8px 24px rgba(244,114,182,0.4)' }}>
              {saving ? 'Saving…' : saveSuccess ? '✓ Saved! Great work 💪' : '✓ Save Workout'}
            </button>
            <button onClick={cancelSession} className="w-full text-white/30 text-sm py-3">Discard</button>
          </div>
        </div>
      )
    }

    // ── Rest screen ────────────────────────────────────────────────────────
    if (phase === 'rest') {
      const circ = 2 * Math.PI * 54
      const progress = restTotal > 0 ? restLeft / restTotal : 0
      const mins = Math.floor(restLeft / 60), secs = restLeft % 60
      const isLastSet = setIdx + 1 >= (ex?.sets.length ?? 1)
      const nextExIdx = isLastSet ? exIdx + 1 : exIdx
      const nextLabel = !isLastSet
        ? `Set ${setIdx + 2} · ${ex?.name}`
        : nextExIdx < session.exercises.length
          ? session.exercises[nextExIdx]?.name
          : 'Final stretch!'

      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 pb-nav">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-14 pb-4">
            <div className="flex items-center gap-1.5">
              {session.exercises.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-300"
                  style={{ width: i === exIdx ? 24 : 8, background: i < exIdx ? '#F472B6' : i === exIdx ? '#F472B6' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
            <button onClick={cancelSession} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2">Rest</p>
          {restTotal !== suggestedRest && (
            <p className="text-white/20 text-xs mb-2">suggested {suggestedRest}s</p>
          )}

          <div className="relative w-44 h-44 mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F472B6" strokeWidth="5"
                strokeDasharray={`${progress * circ} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-5xl font-bold tabular-nums tracking-tight">
                {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-10">
            <button onClick={() => adjustRest(-15)}
              className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Minus className="w-5 h-5 text-white/70" />
            </button>
            <div className="text-center">
              <p className="text-white/30 text-xs mb-0.5">Next up</p>
              <p className="text-white font-semibold text-base tracking-tight">{nextLabel}</p>
            </div>
            <button onClick={() => adjustRest(15)}
              className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Plus className="w-5 h-5 text-white/70" />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={goBack}
              className="flex items-center gap-2 text-white/40 text-sm font-medium py-3 px-5 rounded-2xl active:scale-[0.97] transition-transform"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => { restEndRef.current = Date.now(); setRestLeft(0); setPhase('exercise') }}
              className="flex items-center gap-2 text-white/50 text-sm font-medium py-3 px-5 rounded-2xl active:scale-[0.97] transition-transform"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <SkipForward className="w-4 h-4" /> Skip rest
            </button>
          </div>
        </div>
      )
    }

    // ── Exercise log screen ────────────────────────────────────────────────
    const doneSetsForEx = ex?.sets.filter((s, i) => i < setIdx && s.done) ?? []

    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        {/* Dark header */}
        <div className="bg-black px-5 pt-14 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Exercise {exIdx + 1} / {session.exercises.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Set {setIdx + 1} of {ex?.sets.length}</p>
            </div>
            <button onClick={cancelSession} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>

          {/* Tappable progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {session.exercises.map((_, i) => (
              <button key={i}
                onClick={() => {
                  if (i >= exIdx) return
                  setExIdx(i); setSetIdx(0)
                  setCurWeight(String(session.exercises[i].sets[0].weight || ''))
                  setCurReps(String(session.exercises[i].sets[0].reps || ''))
                  setPhase('exercise')
                }}
                className="h-1 rounded-full transition-all duration-300"
                style={{ width: i === exIdx ? 24 : 8, background: i === exIdx ? '#F472B6' : i < exIdx ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </div>

        {/* PR banner */}
        {newPR === ex?.name && (
          <div className="mx-5 mt-3 px-4 py-3 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)' }}>
            <p className="text-white font-bold text-sm">🏆 New PR! {newPR}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col px-5 pt-6 pb-8">
          {/* Exercise name + PR */}
          <div className="mb-6">
            <h1 className="text-[#0A0A0A] text-3xl font-bold tracking-tight leading-tight mb-1">{ex?.name}</h1>
            {best1RM && !newPR && (
              <p className="text-[11px] mt-1" style={{ color: '#F472B6' }}>PR: ~{Math.round(best1RM)} kg 1RM</p>
            )}
          </div>

          {/* Form cue */}
          {tip && (
            <div className="mb-4 px-3 py-2.5 rounded-2xl flex items-start gap-2" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.15)' }}>
              <span style={{ color: '#F472B6' }} className="text-xs mt-0.5">✦</span>
              <p className="text-xs font-semibold leading-snug" style={{ color: '#DB2777' }}>{tip}</p>
            </div>
          )}

          {/* Weight + Reps inputs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ACACAC] mb-3">Weight (kg)</p>
              <input type="number" inputMode="decimal" placeholder="—"
                value={curWeight} onChange={e => setCurWeight(e.target.value)} autoFocus
                className="w-full text-4xl font-bold text-[#0A0A0A] bg-transparent focus:outline-none" />
            </div>
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ACACAC] mb-3">Reps</p>
              <input type="number" inputMode="numeric" placeholder="—"
                value={curReps} onChange={e => setCurReps(e.target.value)}
                className="w-full text-4xl font-bold text-[#0A0A0A] bg-transparent focus:outline-none" />
            </div>
          </div>

          {/* Sets done this exercise */}
          {doneSetsForEx.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ACACAC] mb-2">This session</p>
              <div className="flex gap-2 flex-wrap">
                {doneSetsForEx.map((s, i) => (
                  <div key={i} className="bg-[#0A0A0A] rounded-xl px-3 py-2 text-center min-w-[60px]">
                    <p className="text-white text-xs font-bold">{s.weight || '—'} kg</p>
                    <p className="text-white/40 text-[10px]">{s.reps || '—'} reps</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last session */}
          {lastSession && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ACACAC] mb-2">Last time</p>
              <div className="flex gap-2 flex-wrap">
                {lastSession.sets.slice(-4).map((s, i) => (
                  <div key={i} className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2 text-center min-w-[60px]">
                    <p className="text-[#0A0A0A] text-xs font-bold">{s.weight} kg</p>
                    <p className="text-[#ACACAC] text-[10px]">{s.reps} reps</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall progress bar */}
          <div className="mb-5">
            <div className="w-full h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`, background: '#F472B6' }} />
            </div>
            <p className="text-[10px] text-[#ACACAC] mt-1">{doneSets}/{totalSets} sets total</p>
          </div>

          {/* CTAs */}
          <div className="mt-auto space-y-2">
            <button onClick={completeSet}
              className="w-full text-white rounded-2xl py-5 font-semibold text-base tracking-tight transition active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)', boxShadow: '0 8px 24px rgba(244,114,182,0.35)' }}>
              <Check className="w-5 h-5" strokeWidth={2.5} /> Done — Set {setIdx + 1}
            </button>
            <div className="flex gap-2">
              <button onClick={() => {
                const rest = suggestRest(parseInt(curReps) || 10)
                setSuggestedRest(rest); setRestTotal(rest)
                restEndRef.current = Date.now() + rest * 1000
                setRestLeft(rest)
                setSetIdx(s => Math.min(s + 1, (ex?.sets.length ?? 1) - 1))
                setPhase('rest')
              }} className="flex-1 py-2.5 text-sm text-[#ACACAC] text-center">Skip set</button>
              {!ex?.skipped && (
                <button onClick={skipExercise}
                  className="flex-1 py-2.5 text-sm text-[#ACACAC] flex items-center justify-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Machine busy
                </button>
              )}
              {ex?.skipped && (
                <p className="flex-1 text-center text-xs py-2.5" style={{ color: '#F472B6' }}>Returning to skipped</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Plan list ──────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        <button onClick={() => setShowNewPlan(true)}
          className="text-white font-bold text-sm px-4 py-2 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)' }}>
          + New Plan
        </button>
      </div>

      {/* Period mode */}
      <button onClick={() => { setShowPeriodModal(true); setPeriodPlan(null) }}
        className="w-full flex items-center gap-3 bg-white rounded-3xl px-5 py-4 active:scale-[0.98] transition-transform"
        style={{ boxShadow: '0 2px 12px rgba(244,114,182,0.12)', border: '1.5px solid rgba(244,114,182,0.15)' }}>
        <span className="text-2xl">🌸</span>
        <div className="text-left flex-1">
          <p className="font-bold text-gray-800 text-sm">I&apos;m on my period</p>
          <p className="text-xs text-gray-400">AI-adapted workout for how you feel today</p>
        </div>
        <span style={{ color: '#F472B6' }}>›</span>
      </button>

      {plans.length === 0 && !showNewPlan && (
        <div className="bg-white rounded-3xl p-8 text-center space-y-3" style={{ boxShadow: '0 2px 12px rgba(244,114,182,0.08)' }}>
          <span className="text-4xl">💪</span>
          <p className="font-bold text-gray-700">No workout plans yet</p>
          <p className="text-sm text-gray-400">Create your first plan to get started</p>
        </div>
      )}

      {plans.map(plan => (
        <div key={plan.id} className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(244,114,182,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">{plan.name}</h2>
            <button onClick={async () => { await supabase.from('ll_workout_plans').delete().eq('id', plan.id); loadPlans() }}
              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plan.exercises.map(ex => (
              <span key={ex.id} className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(244,114,182,0.08)', color: '#DB2777', border: '1px solid rgba(244,114,182,0.15)' }}>
                {ex.name}
              </span>
            ))}
          </div>
          <button onClick={() => startSession(plan)}
            className="w-full text-white font-bold text-sm py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)', boxShadow: '0 4px 16px rgba(244,114,182,0.3)' }}>
            Start Session →
          </button>
        </div>
      ))}

      {/* New plan form */}
      {showNewPlan && (
        <div className="bg-white rounded-3xl p-5 space-y-4" style={{ boxShadow: '0 2px 12px rgba(244,114,182,0.08)' }}>
          <h2 className="font-bold text-gray-900">New Plan</h2>
          <input value={newPlanName} onChange={e => setNewPlanName(e.target.value)}
            placeholder="Plan name (e.g. Push Day A)"
            className="w-full bg-[#FDF2F8] rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#F472B6' } as React.CSSProperties} />
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exercises</p>
            {newExercises.map((ex, i) => (
              <div key={i} className="space-y-2 rounded-2xl p-3" style={{ background: '#FDF2F8' }}>
                <input value={ex.name} onChange={e => { const u = [...newExercises]; u[i] = { ...u[i], name: e.target.value }; setNewExercises(u) }}
                  placeholder="Exercise name"
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm font-medium outline-none" />
                <div className="grid grid-cols-3 gap-2">
                  {(['defaultSets', 'defaultReps', 'defaultWeight'] as const).map(f => (
                    <div key={f} className="text-center">
                      <input type="number" value={ex[f]}
                        onChange={e => { const u = [...newExercises]; u[i] = { ...u[i], [f]: Number(e.target.value) }; setNewExercises(u) }}
                        className="w-full bg-white rounded-xl px-2 py-1.5 text-sm font-bold text-center outline-none" />
                      <p className="text-[10px] text-gray-400 mt-0.5">{f === 'defaultSets' ? 'sets' : f === 'defaultReps' ? 'reps' : 'kg'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setNewExercises([...newExercises, { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])}
              className="text-sm font-semibold" style={{ color: '#F472B6' }}>+ Add exercise</button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewPlan(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold text-sm py-3 rounded-2xl">Cancel</button>
            <button onClick={savePlan}
              className="flex-1 text-white font-bold text-sm py-3 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #F472B6, #DB2777)' }}>Save Plan</button>
          </div>
        </div>
      )}

      {/* Period modal */}
      {showPeriodModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowPeriodModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="overflow-y-auto flex-1 px-5 space-y-5 pb-safe" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom,20px) + 80px)' }}>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">🌸 Period Check-In</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Tell me how you&apos;re feeling today</p>
                </div>
                <button onClick={() => setShowPeriodModal(false)} className="text-gray-300 text-2xl font-light">✕</button>
              </div>

              {!periodPlan ? (
                <>
                  {[
                    { key: 'cramps' as const, label: 'Cramps', labels: ['', 'None 😊', 'Mild 🙂', 'Moderate 😣', 'Ugh 😖', 'Severe 😵'], lo: 'None', hi: 'Severe' },
                    { key: 'energy' as const, label: 'Energy Level', labels: ['', 'Drained 🪫', 'Low ⬇️', 'Okay 😐', 'Decent 🙂', 'Normal ⚡'], lo: 'Drained', hi: 'Normal' },
                    { key: 'bloating' as const, label: 'Bloating', labels: ['', 'None 😊', 'A little 🙂', 'Noticeable 😐', 'A lot 😮‍💨', 'Very bloated 🎈'], lo: 'None', hi: 'Very bloated' },
                    { key: 'mood' as const, label: 'Mood', labels: ['', 'Awful 😤', 'Low 😔', 'Meh 😐', 'Okay 🙂', 'Good 😊'], lo: 'Awful', hi: 'Good' },
                  ].map(({ key, label, labels, lo, hi }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700">{label}</label>
                        <span className="text-sm font-bold" style={{ color: '#F472B6' }}>{labels[periodForm[key]]}</span>
                      </div>
                      <input type="range" min={1} max={5} value={periodForm[key]}
                        onChange={e => setPeriodForm(f => ({ ...f, [key]: +e.target.value }))}
                        className="w-full accent-pink-400" />
                      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5"><span>{lo}</span><span>{hi}</span></div>
                    </div>
                  ))}

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Lower back pain?</label>
                    <div className="flex gap-3">
                      {['no', 'yes'].map(v => (
                        <button key={v} onClick={() => setPeriodForm(f => ({ ...f, backPain: v }))}
                          className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                          style={periodForm.backPain === v ? { background: 'linear-gradient(135deg,#F472B6,#DB2777)', color: 'white' } : { background: '#FDF2F8', color: '#6b7280' }}>
                          {v === 'no' ? '✅ No' : '😣 Yes'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Time available</label>
                    <div className="flex gap-2">
                      {['20', '30', '45', '60'].map(t => (
                        <button key={t} onClick={() => setPeriodForm(f => ({ ...f, available: t }))}
                          className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                          style={periodForm.available === t ? { background: 'linear-gradient(135deg,#F472B6,#DB2777)', color: 'white' } : { background: '#FDF2F8', color: '#6b7280' }}>
                          {t}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={generatePeriodPlan} disabled={periodLoading}
                    className="w-full text-white font-bold py-4 rounded-3xl active:scale-95 transition-transform disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#F472B6,#DB2777)', boxShadow: '0 8px 24px rgba(244,114,182,0.35)' }}>
                    {periodLoading ? '✨ Creating your plan…' : '✨ Generate My Plan'}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: periodPlan.intensity === 'rest' ? '#a78bfa' : periodPlan.intensity === 'gentle' ? '#60a5fa' : periodPlan.intensity === 'moderate' ? '#fbbf24' : '#F472B6' }}>
                    {periodPlan.intensity === 'rest' ? '🛋️ Rest Day' : periodPlan.intensity === 'gentle' ? '🌸 Gentle' : periodPlan.intensity === 'moderate' ? '🙂 Moderate' : '💪 Normal'}
                  </span>
                  <div className="rounded-2xl p-4" style={{ background: '#FDF2F8', border: '1px solid rgba(244,114,182,0.15)' }}>
                    <p className="text-sm text-gray-700 leading-relaxed">{periodPlan.message}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">{periodPlan.plan_name}</p>
                  <div className="space-y-2">
                    {periodPlan.exercises.map((ex, i) => (
                      <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
                        style={{ border: '1px solid rgba(244,114,182,0.12)', boxShadow: '0 2px 8px rgba(244,114,182,0.06)' }}>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">{ex.name}</p>
                          {ex.note && <p className="text-xs text-gray-400 mt-0.5">{ex.note}</p>}
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: 'rgba(244,114,182,0.08)', color: '#DB2777' }}>
                          {ex.sets}×{ex.reps}{ex.weight > 0 ? ` · ${ex.weight}kg` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={startPeriodSession}
                    className="w-full text-white font-bold py-4 rounded-3xl active:scale-95 transition-transform"
                    style={{ background: 'linear-gradient(135deg,#F472B6,#DB2777)', boxShadow: '0 8px 24px rgba(244,114,182,0.35)' }}>
                    Start This Workout 🌸
                  </button>
                  <button onClick={() => setPeriodPlan(null)} className="w-full text-gray-400 text-sm font-semibold py-2">← Adjust answers</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
