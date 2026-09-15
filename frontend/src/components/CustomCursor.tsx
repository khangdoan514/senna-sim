/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM CURSOR — src/components/CustomCursor.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Filled diamond cursor:
 *   • Dark fill + red stroke — depth between the two
 *   • Hover → slow spin + subtle glow + slight grow (CSS animation)
 *   • Click → explosion of diamond fragments radiating outward
 *   • Canvas trail fades behind movement
 */

import { useEffect, useRef } from 'react'

const STROKE     = '#D82B0D'
const FILL       = 'rgba(10,12,14,0.82)'
const TRAIL_LIFE = 280
const TRAIL_MAX  = 20

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number          // 1 → 0
  size: number
  angle: number
  spin: number
  color: string
}

const PARTICLE_COLORS = [
  '#D82B0D',
  'rgba(216,43,13,0.75)',
  'rgba(240,235,216,0.55)',
  '#D82B0D',
  'rgba(159,160,195,0.5)',
]

export default function CustomCursor() {
  const cursorRef   = useRef<HTMLDivElement>(null)
  const svgRef      = useRef<SVGSVGElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const trail       = useRef<{ x: number; y: number; t: number }[]>([])
  const particles   = useRef<Particle[]>([])
  const hover       = useRef(false)
  const mousePos    = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const cursor = cursorRef.current
    const svg    = svgRef.current
    const canvas = canvasRef.current
    if (!cursor || !svg || !canvas) return

    // ── Canvas resize ────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Mouse move ───────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      trail.current.push({ x: e.clientX, y: e.clientY, t: performance.now() })
      if (trail.current.length > TRAIL_MAX) trail.current.shift()
    }

    // ── Hover states ─────────────────────────────────────────────────────
    const onEnter = () => { hover.current = true;  svg.classList.add('diamond-hover') }
    const onLeave = () => { hover.current = false; svg.classList.remove('diamond-hover') }

    document.addEventListener('mousemove', onMove)

    const attachHover = () => {
      document.querySelectorAll(
        'a, button, select, input, textarea, [role="button"], [tabindex]'
      ).forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    attachHover()
    const mo = new MutationObserver(attachHover)
    mo.observe(document.body, { childList: true, subtree: true })

    // ── Click explosion ──────────────────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      const count = 9 + Math.floor(Math.random() * 4)   // 9–12 shards
      for (let i = 0; i < count; i++) {
        const angle  = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
        const speed  = 2.8 + Math.random() * 5.2
        particles.current.push({
          x:     e.clientX,
          y:     e.clientY,
          vx:    Math.cos(angle) * speed,
          vy:    Math.sin(angle) * speed,
          life:  1,
          size:  1.8 + Math.random() * 2.8,
          angle: Math.random() * Math.PI * 2,
          spin:  (Math.random() - 0.5) * 0.18,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        })
      }
    }
    document.addEventListener('click', onClick)

    // ── Draw loop ─────────────────────────────────────────────────────────
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const draw = () => {
      const now = performance.now()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // — Trail —
      while (trail.current.length > 0 && now - trail.current[0].t > TRAIL_LIFE) {
        trail.current.shift()
      }
      const pts = trail.current
      for (let i = 1; i < pts.length; i++) {
        const prev     = pts[i - 1]
        const curr     = pts[i]
        const prog     = i / pts.length
        const ageAlpha = Math.max(0, 1 - (now - curr.t) / TRAIL_LIFE)
        const alpha    = prog * ageAlpha * (hover.current ? 0.4 : 0.18)
        if (alpha < 0.01) continue

        ctx.globalAlpha = alpha
        ctx.strokeStyle = STROKE
        ctx.lineWidth   = prog * 1.8
        ctx.lineCap     = 'round'
        ctx.shadowColor = STROKE
        ctx.shadowBlur  = hover.current && prog > 0.7 ? 3 : 0
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(curr.x, curr.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur  = 0

      // — Explosion particles —
      particles.current = particles.current.filter(p => p.life > 0)
      for (const p of particles.current) {
        // decay faster near end of life
        p.life  -= 0.038
        p.x     += p.vx
        p.y     += p.vy
        p.vx    *= 0.91          // friction
        p.vy    *= 0.91
        p.vy    += 0.12          // gravity
        p.angle += p.spin

        const len = p.size * p.life * 2.8   // long axis  — always reads as a shard
        const wid = p.size * p.life * 0.28  // short axis — ~10:1 ratio, never square

        ctx.save()
        ctx.globalAlpha = Math.pow(p.life, 1.4) * 0.9
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)

        // draw thin elongated shard
        ctx.beginPath()
        ctx.moveTo(0,   -len)
        ctx.lineTo(wid,  0)
        ctx.lineTo(0,    len)
        ctx.lineTo(-wid, 0)
        ctx.closePath()

        ctx.fillStyle   = p.color
        ctx.shadowColor = STROKE
        ctx.shadowBlur  = p.life > 0.5 ? 5 : 0
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur  = 0

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick)
      mo.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* Trail + explosion canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 99990 }}
      />

      {/* Diamond cursor
          Container fixed at 0,0 — transform drives position.
          Centering wrapper keeps the diamond centred on the hot point. */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ zIndex: 99999, willChange: 'transform' }}
      >
        <div style={{ transform: 'translate(-50%, -50%)' }}>
          <svg
            ref={svgRef}
            width="24"
            height="24"
            viewBox="-12 -12 24 24"
            className="diamond-cursor"
            style={{ display: 'block' }}
          >
            <polygon
              points="0,-8.5 8.5,0 0,8.5 -8.5,0"
              fill={FILL}
              stroke={STROKE}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>

          <style>{`
            .diamond-cursor {
              transform-origin: center;
              transition: filter 0.2s ease;
            }

            /* Hover: spin + subtle grow + glow — all in one keyframe so
               transform isn't split across animation and transition */
            .diamond-hover {
              animation: diamond-spin-glow 1.5s linear infinite;
            }

            @keyframes diamond-spin-glow {
              0% {
                transform: scale(1.2) rotate(0deg);
                filter: drop-shadow(0 0 3px ${STROKE}) drop-shadow(0 0 7px rgba(216,43,13,0.35));
              }
              50% {
                filter: drop-shadow(0 0 5px ${STROKE}) drop-shadow(0 0 13px rgba(216,43,13,0.55));
              }
              100% {
                transform: scale(1.2) rotate(360deg);
                filter: drop-shadow(0 0 3px ${STROKE}) drop-shadow(0 0 7px rgba(216,43,13,0.35));
              }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}
