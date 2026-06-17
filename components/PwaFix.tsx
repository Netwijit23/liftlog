'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PwaFix() {
  const router = useRouter()

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true

    if (!isStandalone) return

    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto')) return
      e.preventDefault()
      router.push(href)
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [router])

  return null
}
