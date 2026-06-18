'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { USER_ID } from '@/lib/user'
import { useRouter } from 'next/navigation'

export default function StartChallenge() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function start() {
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('ll_challenge_profile').upsert(
      { user_id: USER_ID, challenge_start_date: today, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="w-full gradient-pink text-white font-bold py-3 rounded-2xl shadow-pink-sm active:scale-95 transition-transform disabled:opacity-60 text-sm mt-1"
    >
      {loading ? 'Starting…' : '🚀 Start My 30-Day Challenge'}
    </button>
  )
}
