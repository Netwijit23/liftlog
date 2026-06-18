'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'
import { getExerciseTip } from '@/lib/exerciseTips'

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

// Suggest rest based on rep target: high reps = shorter rest
function suggestRest(reps: number): number {
  if (reps >= 15) return 60
  if (reps >= 10) return 75
  return 90
}

interface ExHistory {
  exerciseName: string
  sets: { reps: number; weight: number }[]
  date: string
}

type SessionPhase = 'exercise' | 'rest' | 'summary'

// ── Helpers ────────────────────────────────────────────────────────────────

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NumberInput({
  label, value, onChange, suffix = '',
}: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string
}) {
  return (
    <div className="flex-1 bg-blush-50 rounded-3xl p-4 flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={value || ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
            else if (e.target.value === '') onChange(0)
          }}
          className="w-24 text-center text-4xl font-bold text-gray-900 bg-transparent outline-none tabular-nums focus:text-pink-500 transition-colors"
          style={{ minWidth: 0 }}
        />
        {suffix && <span className="text-base text-gray-400 font-semibold">{suffix}</span>}
      </div>
    </div>
  )
}

function PRBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 animate-bounce">
      🏆 New PR!
    </span>
  )
}

function RestTimer({
  seconds, total, onSkip, onAdjust, nextLabel, suggested,
}: {
  seconds: number; total: number; onSkip: () => void
  onAdjust: (delta: number) => void; nextLabel: string; suggested: number
}) {
  const pct = Math.max(0, seconds / total)
  const r = 72
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Rest Up 💤</h2>
        <p className="text-sm text-gray-400 mt-1">Next: {nextLabel}</p>
      </div>

      {/* Countdown ring */}
      <div className="relative w-48 h-48">
        <svg width="192" height="192" className="-rotate-90">
          <circle cx="96" cy="96" r={r} fill="none" stroke="#FCE7F3" strokeWidth="10"/>
          <circle
            cx="96" cy="96" r={r} fill="none"
            stroke="url(#rest-grad)" strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
          <defs>
            <linearGradient id="rest-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F472B6"/>
              <stop offset="100%" stopColor="#DB2777"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-900 tabular-nums">{seconds}</span>
          <span className="text-sm text-gray-400 font-medium">seconds</span>
        </div>
      </div>

      {/* Adjust rest time */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onAdjust(-15)}
          className="w-11 h-11 rounded-full bg-white border-2 border-pink-100 text-pink-500 font-bold text-lg shadow-pink-sm active:scale-90 transition-transform"
        >−</button>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rest time</p>
          {total !== suggested && (
            <p className="text-[10px] text-pink-400 font-semibold">suggested {suggested}s</p>
          )}
        </div>
        <button
          onClick={() => onAdjust(15)}
          className="w-11 h-11 rounded-full bg-white border-2 border-pink-100 text-pink-500 font-bold text-lg shadow-pink-sm active:scale-90 transition-transform"
        >+</button>
      </div>

      <button
        onClick={onSkip}
        className="w-full gradient-pink text-white font-bold text-base py-4 rounded-3xl shadow-pink-md active:scale-95 transition-transform"
      >
        Skip Rest →
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const supabase = createClient()

  // Plan list state
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newExercises, setNewExercises] = useState([
    { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
  ])

  // Session state
  const [session, setSession] = useState<{
    planId: string; planName: string; exercises: ExerciseLog[]
  } | null>(null)
  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('exercise')
  const [restLeft, setRestLeft] = useState(90)
  const [restTotal, setRestTotal] = useState(90)
  const [suggestedRest, setSuggestedRest] = useState(90)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Current set working values
  const [curWeight, setCurWeight] = useState(0)
  const [curReps, setCurReps] = useState(0)


  // History & PRs
  const [history, setHistory] = useState<ExHistory[]>([])
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [newPR, setNewPR] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadPlans = useCallback(async () => {
    const { data } = await supabase.from('ll_workout_plans').select('*').eq('user_id', USER_ID).order('created_at')
    if (data) setPlans(data as WorkoutPlan[])
  }, [supabase])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('ll_workout_logs').select('*')
      .eq('user_id', USER_ID).order('date', { ascending: false }).limit(60)
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

  // Rest timer tick
  useEffect(() => {
    if (phase !== 'rest') {
      if (restRef.current) clearInterval(restRef.current)
      return
    }
    restRef.current = setInterval(() => {
      setRestLeft((t) => {
        if (t <= 1) { advanceAfterRest(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (restRef.current) clearInterval(restRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function initSession(planId: string, planName: string, exercises: ExerciseLog[]) {
    setSession({ planId, planName, exercises })
    setExIdx(0)
    setSetIdx(0)
    setPhase('exercise')
    setCurWeight(exercises[0].sets[0].weight)
    setCurReps(exercises[0].sets[0].reps)
    setNewPR(null)
    setSkippedIds(new Set())
    const s = suggestRest(exercises[0].sets[0].reps)
    setSuggestedRest(s)
    setRestTotal(s)
    setRestLeft(s)
  }

  function startSession(plan: WorkoutPlan) {
    const exercises: ExerciseLog[] = plan.exercises.map((ex) => ({
      id: ex.id, name: ex.name,
      sets: Array.from({ length: ex.defaultSets }, () => ({
        weight: ex.defaultWeight, reps: ex.defaultReps, done: false,
      })),
    }))
    initSession(plan.id, plan.name, exercises)
  }

function advanceAfterRest() {
    if (restRef.current) clearInterval(restRef.current)
    setPhase('exercise')
  }

  function adjustRest(delta: number) {
    const newTotal = Math.max(15, restTotal + delta)
    setRestTotal(newTotal)
    setRestLeft((prev) => Math.max(1, Math.min(prev + delta, newTotal)))
  }

  function skipExercise() {
    if (!session) return
    const ex = session.exercises[exIdx]
    // Move skipped exercise to end; track its id
    const remaining = session.exercises.filter((_, i) => i !== exIdx)
    const reordered = [...remaining, { ...ex, skipped: true }]
    setSkippedIds((prev) => new Set(Array.from(prev).concat(ex.id)))
    setSession({ ...session, exercises: reordered })
    // Stay at same exIdx (next exercise slides in), or go to summary if none left
    const nextIdx = exIdx < remaining.length ? exIdx : 0
    if (remaining.length === 0) { setPhase('summary'); return }
    setExIdx(nextIdx)
    setSetIdx(0)
    setCurWeight(remaining[nextIdx].sets[0].weight)
    setCurReps(remaining[nextIdx].sets[0].reps)
  }

  function completeSet() {
    if (!session) return

    // Save the logged values into session
    const updated = session.exercises.map((ex, ei) =>
      ei === exIdx
        ? {
            ...ex, sets: ex.sets.map((s, si) =>
              si === setIdx ? { weight: curWeight, reps: curReps, done: true } : s
            ),
          }
        : ex
    )
    setSession({ ...session, exercises: updated })

    // PR check
    const exName = session.exercises[exIdx].name
    const rm = epley(curWeight, curReps)
    if (!prs[exName] || rm > prs[exName]) {
      if (prs[exName]) {
        setNewPR(exName)
        setTimeout(() => setNewPR(null), 3000)
      }
      setPrs((p) => ({ ...p, [exName]: rm }))
    }

    const ex = updated[exIdx]
    const nextSetIdx = setIdx + 1

    function goToRest(nextReps: number) {
      const s = suggestRest(nextReps)
      setSuggestedRest(s)
      setRestTotal(s)
      setRestLeft(s)
      setPhase('rest')
    }

    if (nextSetIdx < ex.sets.length) {
      setSetIdx(nextSetIdx)
      setCurWeight(ex.sets[nextSetIdx].weight)
      setCurReps(ex.sets[nextSetIdx].reps)
      goToRest(ex.sets[nextSetIdx].reps)
    } else {
      const nextExIdx = exIdx + 1
      if (nextExIdx < updated.length) {
        setExIdx(nextExIdx)
        setSetIdx(0)
        setCurWeight(updated[nextExIdx].sets[0].weight)
        setCurReps(updated[nextExIdx].sets[0].reps)
        goToRest(updated[nextExIdx].sets[0].reps)
      } else {
        setPhase('summary')
      }
    }
  }

  async function saveWorkout() {
    if (!session) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const sets = session.exercises.map((ex) => ({
      exerciseName: ex.name,
      sets: ex.sets.filter((s) => s.done).map(({ weight, reps }) => ({ weight, reps })),
    }))
    await supabase.from('ll_workout_logs').insert({
      user_id: USER_ID, date: today,
      plan_id: session.planId, plan_name: session.planName, sets,
    })
    await supabase.from('ll_daily_logs').upsert({
      user_id: USER_ID, date: today,
      workout_completed: true, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
    await loadHistory()
    setSaving(false)
    setSession(null)
    setPhase('exercise')
  }

  function cancelSession() {
    if (restRef.current) clearInterval(restRef.current)
    setSession(null)
    setPhase('exercise')
    setSkippedIds(new Set())
    setRestTotal(90)
    setRestLeft(90)
  }

  async function savePlan() {
    if (!newPlanName.trim()) return
    const exs = newExercises.filter((e) => e.name.trim()).map((e) => ({ id: crypto.randomUUID(), ...e }))
    await supabase.from('ll_workout_plans').insert({ user_id: USER_ID, name: newPlanName, exercises: exs })
    setNewPlanName('')
    setNewExercises([{ name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])
    setShowNewPlan(false)
    loadPlans()
  }

  // ── Active session UI ────────────────────────────────────────────────────

  if (session) {
    const ex = session.exercises[exIdx]
    const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0)
    const doneSets = session.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)
    const lastSession = history.find((h) => h.exerciseName === ex?.name)
    const best1RM = prs[ex?.name ?? '']

    // ── Summary screen ──────────────────────────────────────────────────
    if (phase === 'summary') {
      const totalVol = session.exercises.reduce(
        (a, e) => a + e.sets.filter((s) => s.done).reduce((b, s) => b + s.weight * s.reps, 0), 0
      )
      return (
        <div className="px-4 py-6 flex flex-col min-h-[80vh]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900">Workout Complete!</h1>
            <p className="text-sm text-gray-400 mt-1">{session.planName}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Sets', value: doneSets.toString() },
              { label: 'Exercises', value: session.exercises.length.toString() },
              { label: 'Volume', value: `${(totalVol / 1000).toFixed(1)}t` },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-4 shadow-pink-sm text-center">
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Exercise breakdown */}
          <div className="space-y-3 mb-6">
            {session.exercises.map((e) => {
              const doneSetsForEx = e.sets.filter((s) => s.done)
              if (doneSetsForEx.length === 0) return null
              return (
                <div key={e.id} className="bg-white rounded-3xl p-4 shadow-pink-sm">
                  <p className="font-bold text-gray-800 text-sm mb-2">{e.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {doneSetsForEx.map((s, i) => (
                      <span key={i} className="text-xs bg-blush-50 text-pink-600 font-bold px-3 py-1 rounded-full border border-pink-100">
                        {s.weight}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={saveWorkout}
            disabled={saving}
            className="w-full gradient-pink text-white font-bold text-base py-4 rounded-3xl shadow-pink-md active:scale-95 transition-all disabled:opacity-60 mt-auto"
          >
            {saving ? 'Saving…' : '✓ Save Workout'}
          </button>
        </div>
      )
    }

    // ── Rest timer screen ───────────────────────────────────────────────
    if (phase === 'rest') {
      const isLastSetOfEx = setIdx === 0 && exIdx > 0
        ? false
        : setIdx <= (ex?.sets.length ?? 1) - 1

      const nextSetNum = setIdx + 1
      const nextLabel = isLastSetOfEx
        ? `Set ${nextSetNum} of ${ex?.sets.length} · ${ex?.name}`
        : exIdx + 1 < session.exercises.length
          ? `Starting ${session.exercises[exIdx]?.name}`
          : 'Final stretch!'

      return (
        <div className="flex flex-col min-h-[85vh] pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <div className="flex gap-1.5">
              {session.exercises.map((e, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    e.skipped ? 'bg-orange-300' : i <= exIdx ? 'gradient-pink' : 'bg-gray-200'
                  }`}
                  style={{ width: i === exIdx ? 24 : 8 }}
                />
              ))}
            </div>
            <button onClick={cancelSession} className="text-gray-400 text-sm font-medium">Cancel</button>
          </div>

          <RestTimer
            seconds={restLeft}
            total={restTotal}
            onSkip={advanceAfterRest}
            onAdjust={adjustRest}
            nextLabel={nextLabel}
            suggested={suggestedRest}
          />

        </div>
      )
    }

    // ── Exercise screen ─────────────────────────────────────────────────
    return (
      <div className="flex flex-col min-h-[88vh] pb-6">

        {/* Top bar: progress dots + cancel */}
        <div className="flex items-center justify-between px-4 pt-6 pb-2">
          <div className="flex gap-1.5 items-center">
            {session.exercises.map((e, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  e.skipped ? 'bg-orange-300' : i < exIdx ? 'gradient-pink' : i === exIdx ? 'gradient-pink' : 'bg-gray-200'
                }`}
                style={{ width: i === exIdx ? 28 : 8 }}
              />
            ))}
          </div>
          <button onClick={cancelSession} className="text-gray-400 text-sm font-medium">Cancel</button>
        </div>

        {/* Exercise meta */}
        <div className="px-4 pb-2">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-0.5">
            Exercise {exIdx + 1} of {session.exercises.length}
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{ex.name}</h1>
            {newPR === ex.name && <PRBadge />}
            {best1RM && !newPR && (
              <span className="text-xs text-gray-400 font-medium">PR ~{Math.round(best1RM)}kg</span>
            )}
          </div>
        </div>

        {/* Static form cue */}
        <div className="px-4 mb-2">
          <div className="flex items-start gap-2 bg-pink-50 border border-pink-100 rounded-2xl px-3 py-2">
            <span className="text-pink-400 text-xs mt-0.5">✦</span>
            <p className="text-xs font-semibold text-pink-700 leading-snug">{getExerciseTip(ex.name)}</p>
          </div>
        </div>

        {/* Set indicator */}
        <div className="px-4 mb-3">
          <div className="flex gap-2 items-center">
            {ex.sets.map((s, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-all ${
                s.done ? 'gradient-pink' : i === setIdx ? 'bg-pink-200' : 'bg-gray-100'
              }`}/>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1.5">
            Set {setIdx + 1} of {ex.sets.length}
          </p>
        </div>

        {/* Last session chips */}
        {lastSession && (
          <div className="px-4 mb-3">
            <p className="text-xs text-gray-400 font-semibold mb-1.5">Last session</p>
            <div className="flex gap-2 flex-wrap">
              {lastSession.sets.map((s, i) => (
                <span key={i} className="text-xs bg-white border border-pink-100 text-gray-600 font-semibold px-3 py-1 rounded-full shadow-pink-sm">
                  {s.weight}kg × {s.reps}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Steppers */}
        <div className="px-4 flex gap-3 mb-4">
          <NumberInput label="Weight" value={curWeight} onChange={setCurWeight} suffix="kg"/>
          <NumberInput label="Reps" value={curReps} onChange={setCurReps}/>
        </div>

        {/* Overall progress */}
        <div className="px-4 mb-4">
          <div className="bg-gray-100 rounded-full h-1.5">
            <div
              className="gradient-pink h-1.5 rounded-full transition-all"
              style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{doneSets}/{totalSets} sets total</p>
        </div>

        {/* CTA */}
        <div className="px-4 mt-auto space-y-2">
          <button
            onClick={completeSet}
            className="w-full gradient-pink text-white font-bold text-base py-4 rounded-3xl shadow-pink-md active:scale-95 transition-transform"
          >
            ✓ Complete Set {setIdx + 1}
          </button>
          {/* Skip exercise — only show if not already returning to a skipped one */}
          {!ex.skipped && (
            <button
              onClick={skipExercise}
              className="w-full flex items-center justify-center gap-1.5 text-gray-400 text-sm font-semibold py-2 active:text-orange-400 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
              </svg>
              Machine busy? Skip for now
            </button>
          )}
          {ex.skipped && (
            <p className="text-center text-xs text-orange-400 font-semibold py-1">
              Returning to skipped exercise
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Plan list ─────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        <button
          onClick={() => setShowNewPlan(true)}
          className="gradient-pink text-white font-bold text-sm px-4 py-2 rounded-2xl shadow-pink-sm"
        >
          + New Plan
        </button>
      </div>

      {plans.length === 0 && !showNewPlan && (
        <div className="bg-white rounded-3xl p-8 shadow-pink-sm text-center space-y-3">
          <span className="text-4xl">💪</span>
          <p className="font-bold text-gray-700">No workout plans yet</p>
          <p className="text-sm text-gray-400">Create your first plan to get started</p>
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-3xl p-5 shadow-pink-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">{plan.name}</h2>
            <button
              onClick={async () => { await supabase.from('ll_workout_plans').delete().eq('id', plan.id); loadPlans() }}
              className="text-gray-300 text-xs hover:text-red-400"
            >Delete</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plan.exercises.map((ex) => (
              <span key={ex.id} className="text-xs bg-blush-50 text-pink-600 font-semibold px-3 py-1 rounded-full border border-pink-100">
                {ex.name}
              </span>
            ))}
          </div>
          <button
            onClick={() => startSession(plan)}
            className="w-full gradient-pink text-white font-bold text-sm py-3.5 rounded-2xl shadow-pink-sm active:scale-95 transition-transform"
          >
            Start Session →
          </button>
        </div>
      ))}

      {showNewPlan && (
        <div className="bg-white rounded-3xl p-5 shadow-pink-sm space-y-4">
          <h2 className="font-bold text-gray-900">New Plan</h2>
          <input
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Plan name (e.g. Push Day A)"
            className="w-full bg-blush-50 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-300"
          />
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Exercises</p>
            {newExercises.map((ex, i) => (
              <div key={i} className="space-y-2 bg-blush-50 rounded-2xl p-3">
                <input
                  value={ex.name}
                  onChange={(e) => {
                    const u = [...newExercises]; u[i] = { ...u[i], name: e.target.value }; setNewExercises(u)
                  }}
                  placeholder="Exercise name"
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm font-medium outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['defaultSets', 'defaultReps', 'defaultWeight'] as const).map((f) => (
                    <div key={f} className="text-center">
                      <input
                        type="number" value={ex[f]}
                        onChange={(e) => {
                          const u = [...newExercises]; u[i] = { ...u[i], [f]: Number(e.target.value) }; setNewExercises(u)
                        }}
                        className="w-full bg-white rounded-xl px-2 py-1.5 text-sm font-bold text-center outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {f === 'defaultSets' ? 'sets' : f === 'defaultReps' ? 'reps' : 'kg'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setNewExercises([...newExercises, { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])}
              className="text-sm text-pink-500 font-semibold"
            >+ Add exercise</button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewPlan(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold text-sm py-3 rounded-2xl">Cancel</button>
            <button onClick={savePlan} className="flex-1 gradient-pink text-white font-bold text-sm py-3 rounded-2xl shadow-pink-sm">Save Plan</button>
          </div>
        </div>
      )}

    </div>
  )
}
