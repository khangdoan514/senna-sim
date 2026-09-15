/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COUNT UP — src/components/CountUp.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Animates a number counting up from 0 to a target value when it scrolls
 * into view. Zero external dependencies — uses IntersectionObserver +
 * requestAnimationFrame.
 */

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  to:        number
  duration?: number
  suffix?:   string
  prefix?:   string
  decimals?: number
  style?:    React.CSSProperties
  className?: string
}

export default function CountUp({
  to,
  duration  = 1800,
  suffix    = '',
  prefix    = '',
  decimals  = 0,
  style,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(`${prefix}${(0).toFixed(decimals)}${suffix}`)
  const ref     = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()

          const tick = (now: number) => {
            const elapsed  = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased    = 1 - Math.pow(1 - progress, 3)
            const value    = eased * to

            setDisplay(`${prefix}${value.toFixed(decimals)}${suffix}`)

            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration, suffix, prefix, decimals])

  return (
    <span ref={ref} style={style} className={className}>
      {display}
    </span>
  )
}
