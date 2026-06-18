'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#EC4899', '#F59E0B', '#FFFFFF', '#F9A8D4', '#FDE68A']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vrot: number
  shape: 'square' | 'circle'
  life: number
}

export default function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const particles: Particle[] = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -16 - 4,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
      life: 1,
    }))

    const gravity = 0.4
    let frame = 0

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      let alive = false
      frame++
      for (const p of particles) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot
        if (frame > 60) p.life -= 0.012
        if (p.life <= 0 || p.y > h + 40) continue
        alive = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (alive) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
