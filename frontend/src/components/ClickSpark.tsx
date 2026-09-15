/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CLICK SPARK — src/components/ClickSpark.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Wraps any element. Every click inside it spawns a burst of animated
 * spark lines radiating from the exact click position.
 */

import { useRef, useEffect, useCallback } from 'react'

interface Spark {
  x:     number
  y:     number
  angle: number
  len:   number
  life:  number
}

interface ClickSparkProps {
  sparkColor?: string
  sparkCount?: number
  sparkSize?:  number
  duration?:   number
  children:    React.ReactNode
  style?:      React.CSSProperties
}

export default function ClickSpark({
  sparkColor = '#e10600',
  sparkCount = 8,
  sparkSize  = 22,
  duration   = 480,
  children,
  style,
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const sparks       = useRef<Spark[]>([])
  const rafRef       = useRef<number>(0)
  const running      = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    const cv = canvasRef.current
    if (!el || !cv) return

    const obs = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      cv.width  = r.width
      cv.height = r.height
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const draw = useCallback(() => {
    const cv  = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, cv.width, cv.height)
    sparks.current = sparks.current.filter(s => s.life > 0)

    for (const s of sparks.current) {
      const ease = 1 - Math.pow(1 - (1 - s.life), 2)
      const dist = ease * s.len

      ctx.save()
      ctx.globalAlpha = s.life * 0.9
      ctx.strokeStyle = sparkColor
      ctx.lineWidth   = 1.5 + s.life * 1.5
      ctx.lineCap     = 'round'
      ctx.shadowColor = sparkColor
      ctx.shadowBlur  = 4

      ctx.beginPath()
      ctx.moveTo(
        s.x + Math.cos(s.angle) * dist * 0.2,
        s.y + Math.sin(s.angle) * dist * 0.2
      )
      ctx.lineTo(
        s.x + Math.cos(s.angle) * dist,
        s.y + Math.sin(s.angle) * dist
      )
      ctx.stroke()
      ctx.restore()

      s.life -= 16 / duration
    }

    if (sparks.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw)
    } else {
      running.current = false
    }
  }, [sparkColor, duration])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cv = canvasRef.current
    if (!cv) return

    const rect = cv.getBoundingClientRect()
    const x    = e.clientX - rect.left
    const y    = e.clientY - rect.top

    for (let i = 0; i < sparkCount; i++) {
      const jitter = (Math.random() - 0.5) * (Math.PI / sparkCount)
      sparks.current.push({
        x, y,
        angle: (i / sparkCount) * Math.PI * 2 + jitter,
        len:   sparkSize * (0.5 + Math.random() * 0.8),
        life:  1,
      })
    }

    if (!running.current) {
      running.current = true
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
  }, [sparkCount, sparkSize, draw])

  return (
    <div ref={containerRef} onClick={handleClick} className="relative" style={style}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[9999]"
      />
      {children}
    </div>
  )
}
