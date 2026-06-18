'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { USER_ID } from '@/lib/user'

function useCheckinDay() {
  const [day, setDay] = useState(1)
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from('ll_challenge_profile').select('challenge_start_date').eq('user_id', USER_ID).maybeSingle()
      .then(({ data }) => {
        if (data?.challenge_start_date) {
          const diff = Math.floor((Date.now() - new Date(data.challenge_start_date).getTime()) / 86400000)
          setDay(Math.max(1, Math.min(30, diff + 1)))
        }
      })
  }, [])
  return day
}

export default function BottomNav() {
  const pathname = usePathname()
  const checkinDay = useCheckinDay()

  const tabs = [
    {
      href: '/',
      label: 'Home',
      match: (p: string) => p === '/',
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/workout',
      label: 'Workout',
      match: (p: string) => p.startsWith('/workout'),
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
          <rect x="2" y="10" width="3" height="4" rx="1" fill={active ? 'currentColor' : 'none'} />
          <rect x="19" y="10" width="3" height="4" rx="1" fill={active ? 'currentColor' : 'none'} />
          <rect x="5" y="8" width="3" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} />
          <rect x="16" y="8" width="3" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} />
          <rect x="8" y="11" width="8" height="2" rx="1" fill={active ? 'currentColor' : 'none'} />
        </svg>
      ),
    },
    {
      href: `/checkin/${checkinDay}`,
      label: 'Check-in',
      center: true,
      match: (p: string) => p.startsWith('/checkin'),
      icon: (_active: boolean) => (
        <div className="w-12 h-12 rounded-full gradient-pink shadow-pink-md flex items-center justify-center -mt-6 border-4 border-blush-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9l-2 2-1-1" />
          </svg>
        </div>
      ),
    },
    {
      href: '/recovery',
      label: 'Recovery',
      match: (p: string) => p.startsWith('/recovery'),
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2-5 4 10 2-5h7" />
        </svg>
      ),
    },
    {
      href: '/progress',
      label: 'Progress',
      match: (p: string) => p.startsWith('/progress'),
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'rgba(253, 242, 248, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(244,114,182,0.15)',
        boxShadow: '0 -4px 24px rgba(236,72,153,0.08)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-1 pb-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = tab.match(pathname)

          if (tab.center) {
            return (
              <Link key={tab.label} href={tab.href} className="flex flex-col items-center gap-0.5 px-2">
                {tab.icon(active)}
                <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-pink-500' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all ${
                active ? 'text-pink-500' : 'text-gray-400'
              }`}
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-pink-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-pink-400 mt-0.5" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
