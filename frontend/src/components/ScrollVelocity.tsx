/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCROLL VELOCITY — src/components/ScrollVelocity.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 **/

import { useEffect, useRef, CSSProperties } from 'react'

export interface VelocitySegment {
  text:    string
  color?:  string
  bold?:   boolean
}

interface ScrollVelocityProps {
  text?:           string
  segments?:       VelocitySegment[]
  baseSpeed?:      number
  scrollStrength?: number
  style?:          CSSProperties
  textStyle?:      CSSProperties
}

// Tyre compound dots
const COMPOUND_DOTS: VelocitySegment[] = [
  { text: ' ⬤ ', color: '#FFD700'  }, // Soft
  { text: ' ⬤ ', color: '#F0EBD8'  }, // Medium
  { text: ' ⬤ ', color: '#555'     }, // Hard
  { text: ' ⬤ ', color: '#39B54A'  }, // Intermediate
]

// Default segment list if no text/segments provided
const DEFAULT_SEGMENTS: VelocitySegment[] = [
  { text: 'TRACKSENSE' },
  COMPOUND_DOTS[0],
  { text: 'ML PREDICTIVE MODELLING' },
  COMPOUND_DOTS[1],
  { text: 'F1 ANALYTICS' },
  COMPOUND_DOTS[2],
  { text: 'ELO RATINGS' },
  COMPOUND_DOTS[3],
  { text: 'RACE SIMULATION' },
  COMPOUND_DOTS[0],
  { text: 'TELEMETRY' },
  COMPOUND_DOTS[1],
  { text: 'MONTE CARLO' },
  COMPOUND_DOTS[2],
  { text: '10,000 RUNS / RACE' },
  COMPOUND_DOTS[3],
]

export default function ScrollVelocity({
  text,
  segments,
  baseSpeed      = 0.80,
  scrollStrength = 3,
  style,
  textStyle,
}: ScrollVelocityProps) {
  const trackRef    = useRef<HTMLDivElement>(null)
  const xRef        = useRef(0)
  const velRef      = useRef(0)
  const lastScrollY = useRef(0)
  const rafRef      = useRef<number>(0)

  useEffect(() => {
    const onScroll = () => {
      const delta         = window.scrollY - lastScrollY.current
      // Cap and scale down so fast scrolling doesn't send it flying
      velRef.current      = Math.max(-8, Math.min(8, delta)) * (scrollStrength * 0.18)
      lastScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollStrength])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const loop = () => {
      // Faster decay so the scroll bump fades out quickly
      velRef.current *= 0.82
      const speed = baseSpeed + velRef.current
      xRef.current -= speed

      const halfWidth = track.scrollWidth / 2
      if (Math.abs(xRef.current) >= halfWidth) xRef.current = 0

      track.style.transform = `translateX(${xRef.current}px)`
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [baseSpeed])

  // Resolve what to render
  const resolvedSegments: VelocitySegment[] = segments
    ? segments
    : text
    ? [{ text }]
    : DEFAULT_SEGMENTS

  // Repeat enough times to fill the track and loop seamlessly
  const REPEAT = 6
  const allSegments = Array.from({ length: REPEAT }, () => resolvedSegments).flat()

  return (
    <div
      className="relative overflow-hidden py-[7px]"
      style={style}
    >
      {/* Darkening overlay — keeps the strip recessive in the layout */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(6,8,9,0.45)', zIndex: 1 }}
      />

      <div
        ref={trackRef}
        className="relative flex items-center whitespace-nowrap will-change-transform"
        style={{ zIndex: 2 }}
      >
        {[0, 1].map(pass => (
          <span key={pass} className="flex items-center">
            {allSegments.map((seg, i) => (
              <span
                key={`${pass}-${i}`}
                className="font-['Zen_Dots'] text-[7px] tracking-[2px] uppercase"
                style={{
                  color:      seg.color ?? (textStyle?.color ?? 'rgba(240,235,216,0.18)'),
                  fontWeight: seg.bold ? 700 : undefined,
                  paddingRight: i === allSegments.length - 1 ? 40 : 0,
                  ...(!seg.color ? textStyle : {}),
                  // Compound dots — slightly larger, dimmer to match the muted strip
                  ...(seg.color && seg.text.trim() === '⬤' ? {
                    fontSize:   9,
                    opacity:    0.55,
                    filter:     `drop-shadow(0 0 3px ${seg.color}66)`,
                  } : {}),
                }}
              >
                {seg.text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}