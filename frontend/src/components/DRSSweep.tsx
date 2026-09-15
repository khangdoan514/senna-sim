/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DRS SWEEP — src/components/DRSSweep.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * On first mount, a red blade slices across the screen at ~80ms (like DRS
 * activation on a broadcast cut), followed by a brief red flash, then gone.
 * Total animation: ~220ms. Won't be noticed consciously — just *felt*.
 */

import { useEffect, useState } from 'react'

type Phase = 'blade' | 'flash' | 'done'

interface DRSSweepProps {
  /** Delay before the blade fires (ms). Default 60 — lets the page paint first. */
  delay?: number
}

export default function DRSSweep({ delay = 60 }: DRSSweepProps) {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('blade'),  delay)
    const t1 = setTimeout(() => setPhase('flash'),  delay + 130)
    const t2 = setTimeout(() => setPhase('done'),   delay + 240)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [delay])

  if (!phase || phase === 'done') return null

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 999998 }}
    >
      {phase === 'blade' && (
        <div style={{
          position:   'absolute',
          top:        0,
          bottom:     0,
          width:      '80px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(216,43,13,0.6) 30%, #D82B0D 50%, rgba(216,43,13,0.6) 70%, transparent 100%)',
          boxShadow:  '0 0 40px #D82B0D, 0 0 100px rgba(216,43,13,0.35)',
          animation:  'drs-blade 0.13s linear forwards',
        }} />
      )}

      {phase === 'flash' && (
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'rgba(216,43,13,0.05)',
          animation:  'drs-flash 0.11s ease-out forwards',
        }} />
      )}

      <style>{`
        @keyframes drs-blade {
          from { left: -80px;  }
          to   { left: calc(100% + 80px); }
        }
        @keyframes drs-flash {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
