'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ID } from '@/lib/user'

interface Exercise {
  id: string
  name: string
  sets: { reps: number; weight: number; done: boolean }[]
}

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

interface ExHistory {
  exerciseName: string
  sets: { reps: number; weight: number }[]
  date: string
}

function epley1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

function PRBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-200 animate-pulse">
      🏆 New PR!
    </span>
  )
}

export default function WorkoutPage() {
  const supabase = createClient()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [activeSession, setActiveSession] = useState<{ planId: string; planName: string; exercises: Exercise[] } | null>(null)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newExercises, setNewExercises] = useState<{ name: string; defaultSets: number; defaultReps: number; defaultWeight: number }[]>([
    { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }
  ])
  const [history, setHistory] = useState<ExHistory[]>([])
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [newPRs, setNewPRs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadPlans = useCallback(async () => {
    const { data } = await supabase.from('workout_plans').select('*').eq('user_id', USER_ID).order('created_at')
    if (data) setPlans(data as WorkoutPlan[])
  }, [supabase])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from('workout_logs').select('*').eq('user_id', USER_ID).order('date', { ascending: false }).limit(50)
    if (!data) return
    const h: ExHistory[] = []
    const prMap: Record<string, number> = {}
    for (const log of data) {
      for (const set of (log.sets as { exerciseName: string; sets: { reps: number; weight: number }[] }[])) {
        h.push({ exerciseName: set.exerciseName, sets: set.sets, date: log.date })
        for (const s of set.sets) {
          const rm = epley1RM(s.weight, s.reps)
          if (!prMap[set.exerciseName] || rm > prMap[set.exerciseName]) {
            prMap[set.exerciseName] = rm
          }
        }
      }
    }
    setHistory(h)
    setPrs(prMap)
  }, [supabase])

  useEffect(() => { loadPlans(); loadHistory() }, [loadPlans, loadHistory])

  const startSession = (plan: WorkoutPlan) => {
    const exercises: Exercise[] = plan.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.defaultSets }, () => ({
        reps: ex.defaultReps,
        weight: ex.defaultWeight,
        done: false,
      })),
    }))
    setActiveSession({ planId: plan.id, planName: plan.name, exercises })
  }

  const toggleSet = (exIdx: number, setIdx: number) => {
    if (!activeSession) return
    const updated = activeSession.exercises.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, done: !s.done } : s) }
        : ex
    )

    const ex = updated[exIdx]
    const exName = ex.name
    const completedSets = ex.sets.filter((s) => s.done)
    if (completedSets.length > 0) {
      const best1RM = Math.max(...completedSets.map((s) => epley1RM(s.weight, s.reps)))
      if (!prs[exName] || best1RM > prs[exName]) {
        if (prs[exName]) {
          setNewPRs((prev) => { const n = new Set(Array.from(prev)); n.add(exName); return n })
          setTimeout(() => setNewPRs((prev) => { const n = new Set(Array.from(prev)); n.delete(exName); return n }), 3000)
        }
        setPrs((prev) => ({ ...prev, [exName]: best1RM }))
      }
    }

    setActiveSession({ ...activeSession, exercises: updated })
  }

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    if (!activeSession) return
    setActiveSession({
      ...activeSession,
      exercises: activeSession.exercises.map((ex, ei) =>
        ei === exIdx
          ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s) }
          : ex
      ),
    })
  }

  const addSet = (exIdx: number) => {
    if (!activeSession) return
    const ex = activeSession.exercises[exIdx]
    const last = ex.sets[ex.sets.length - 1] ?? { reps: 10, weight: 60 }
    setActiveSession({
      ...activeSession,
      exercises: activeSession.exercises.map((e, ei) =>
        ei === exIdx ? { ...e, sets: [...e.sets, { ...last, done: false }] } : e
      ),
    })
  }

  const finishSession = async () => {
    if (!activeSession) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const sets = activeSession.exercises.map((ex) => ({
      exerciseName: ex.name,
      sets: ex.sets.filter((s) => s.done).map(({ reps, weight }) => ({ reps, weight })),
    }))
    await supabase.from('workout_logs').insert({
      user_id: USER_ID,
      date: today,
      plan_id: activeSession.planId,
      plan_name: activeSession.planName,
      sets,
    })
    await supabase.from('daily_logs').upsert({
      user_id: USER_ID,
      date: today,
      workout_completed: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
    setSaving(false)
    setSaved(true)
    await loadHistory()
    setTimeout(() => { setSaved(false); setActiveSession(null) }, 1500)
  }

  const savePlan = async () => {
    if (!newPlanName.trim()) return
    const exs = newExercises.filter((e) => e.name.trim()).map((e) => ({
      id: crypto.randomUUID(),
      ...e,
    }))
    await supabase.from('workout_plans').insert({
      user_id: USER_ID,
      name: newPlanName,
      exercises: exs,
    })
    setNewPlanName('')
    setNewExercises([{ name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])
    setShowNewPlan(false)
    loadPlans()
  }

  const deletePlan = async (id: string) => {
    await supabase.from('workout_plans').delete().eq('id', id)
    loadPlans()
  }

  if (activeSession) {
    const totalDone = activeSession.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0)
    const totalSets = activeSession.exercises.reduce((a, ex) => a + ex.sets.length, 0)

    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeSession.planName}</h1>
            <p className="text-sm text-gray-400">{totalDone}/{totalSets} sets done</p>
          </div>
          <button onClick={() => setActiveSession(null)} className="text-gray-400 text-sm">Cancel</button>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-100 rounded-full h-2">
          <div
            className="gradient-orange h-2 rounded-full transition-all"
            style={{ width: `${totalSets > 0 ? (totalDone / totalSets) * 100 : 0}%` }}
          />
        </div>

        {activeSession.exercises.map((ex, exIdx) => {
          const lastSession = history.find((h) => h.exerciseName === ex.name)
          const best1RM = prs[ex.name]

          return (
            <div key={ex.id} className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{ex.name}</h2>
                <div className="flex items-center gap-2">
                  {newPRs.has(ex.name) && <PRBadge />}
                  {best1RM && (
                    <span className="text-xs text-gray-400 font-medium">
                      1RM ~{Math.round(best1RM)}kg
                    </span>
                  )}
                </div>
              </div>

              {/* Last session chips */}
              {lastSession && (
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 mr-1">Last:</span>
                  {lastSession.sets.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                      {s.weight}×{s.reps}
                    </span>
                  ))}
                </div>
              )}

              {/* Sets */}
              <div className="space-y-2">
                {ex.sets.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSet(exIdx, sIdx)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        s.done ? 'gradient-orange border-transparent text-white' : 'border-gray-200 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span className="text-xs text-gray-400 w-8">Set {sIdx + 1}</span>
                    <input
                      type="number" value={s.weight}
                      onChange={(e) => updateSet(exIdx, sIdx, 'weight', Number(e.target.value))}
                      className="w-16 bg-[#F5F5F7] rounded-xl px-2 py-1.5 text-sm font-bold text-center outline-none"
                    />
                    <span className="text-gray-300 text-xs">kg ×</span>
                    <input
                      type="number" value={s.reps}
                      onChange={(e) => updateSet(exIdx, sIdx, 'reps', Number(e.target.value))}
                      className="w-14 bg-[#F5F5F7] rounded-xl px-2 py-1.5 text-sm font-bold text-center outline-none"
                    />
                    <span className="text-gray-300 text-xs">reps</span>
                    {s.done && (
                      <span className="text-[10px] text-orange-400 font-medium ml-auto">
                        ~{Math.round(epley1RM(s.weight, s.reps))}kg
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(exIdx)}
                className="text-sm text-orange-500 font-semibold flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span> Add set
              </button>
            </div>
          )
        })}

        <button
          onClick={finishSession}
          disabled={saving || totalDone === 0}
          className="w-full gradient-orange text-white font-bold text-base py-4 rounded-3xl shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? '✓ Session saved!' : `Finish Workout (${totalDone} sets)`}
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        <button
          onClick={() => setShowNewPlan(true)}
          className="gradient-orange text-white font-bold text-sm px-4 py-2 rounded-2xl shadow"
        >
          + New Plan
        </button>
      </div>

      {plans.length === 0 && !showNewPlan && (
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-3">
          <span className="text-4xl">💪</span>
          <p className="font-bold text-gray-700">No workout plans yet</p>
          <p className="text-sm text-gray-400">Create your first plan to get started</p>
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">{plan.name}</h2>
            <button onClick={() => deletePlan(plan.id)} className="text-gray-300 text-xs hover:text-red-400">Delete</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plan.exercises.map((ex) => (
              <span key={ex.id} className="text-xs bg-[#F5F5F7] text-gray-600 font-medium px-2.5 py-1 rounded-full">
                {ex.name}
              </span>
            ))}
          </div>
          <button
            onClick={() => startSession(plan)}
            className="w-full gradient-orange text-white font-bold text-sm py-3 rounded-2xl shadow active:scale-95 transition-transform"
          >
            Start Session →
          </button>
        </div>
      ))}

      {showNewPlan && (
        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">New Plan</h2>

          <input
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Plan name (e.g. Push Day A)"
            className="w-full bg-[#F5F5F7] rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400"
          />

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exercises</p>
            {newExercises.map((ex, i) => (
              <div key={i} className="space-y-2 bg-[#F5F5F7] rounded-2xl p-3">
                <input
                  value={ex.name}
                  onChange={(e) => {
                    const upd = [...newExercises]
                    upd[i] = { ...upd[i], name: e.target.value }
                    setNewExercises(upd)
                  }}
                  placeholder="Exercise name"
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm font-medium outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['defaultSets', 'defaultReps', 'defaultWeight'] as const).map((field) => (
                    <div key={field} className="text-center">
                      <input
                        type="number"
                        value={ex[field]}
                        onChange={(e) => {
                          const upd = [...newExercises]
                          upd[i] = { ...upd[i], [field]: Number(e.target.value) }
                          setNewExercises(upd)
                        }}
                        className="w-full bg-white rounded-xl px-2 py-1.5 text-sm font-bold text-center outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {field === 'defaultSets' ? 'sets' : field === 'defaultReps' ? 'reps' : 'kg'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setNewExercises([...newExercises, { name: '', defaultSets: 3, defaultReps: 10, defaultWeight: 60 }])}
              className="text-sm text-orange-500 font-semibold"
            >
              + Add exercise
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowNewPlan(false)}
              className="flex-1 bg-gray-100 text-gray-600 font-bold text-sm py-3 rounded-2xl"
            >
              Cancel
            </button>
            <button
              onClick={savePlan}
              className="flex-1 gradient-orange text-white font-bold text-sm py-3 rounded-2xl shadow"
            >
              Save Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
