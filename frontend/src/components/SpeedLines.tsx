/**
 * 🏎 SPEED LINES — animated radial speed-streak background canvas.
 * Canvas drawing code unchanged; only the canvas element's wrapper uses Tailwind.
 */

import { useEffect, useRef } from 'react'

interface SpeedLinesProps {
  color?:   string
  count?:   number
  opacity?: number
  speed?:   number
}

export default function SpeedLines({ color = '#e10600', count = 20, opacity = 0.07, speed = 1 }: SpeedLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let raf = 0
    let t   = 0

    const lines = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      len:   0.3 + Math.random() * 0.5,
      width: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
    }))

    const resize = () => { cv.width = cv.offsetWidth; cv.height = cv.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const loop = () => {
      const { width: w, height: h } = cv
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2
      const maxLen = Math.sqrt(cx * cx + cy * cy)

      t += 0.008 * speed

      for (const ln of lines) {
        const pulse = (Math.sin(t * ln.speed + ln.phase) + 1) / 2
        const len   = ln.len * maxLen * (0.3 + pulse * 0.7)
        const from  = maxLen * 0.05

        const x1 = cx + Math.cos(ln.angle) * from
        const y1 = cy + Math.sin(ln.angle) * from
        const x2 = cx + Math.cos(ln.angle) * len
        const y2 = cy + Math.sin(ln.angle) * len

        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0, `${color}00`)
        grad.addColorStop(0.4, `${color}${Math.round(opacity * 255 * pulse).toString(16).padStart(2, '0')}`)
        grad.addColorStop(1, `${color}00`)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = grad
        ctx.lineWidth   = ln.width
        ctx.stroke()
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [color, count, opacity, speed])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
  )
}
