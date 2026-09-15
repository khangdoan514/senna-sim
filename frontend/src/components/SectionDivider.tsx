/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION DIVIDER — src/components/SectionDivider.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Three variants:
 *   "sector"  — S1/S2/S3 coloured bars that draw in on scroll (timing board)
 *   "slash"   — diagonal livery-style cut with red accent
 *   "data"    — scrolling telemetry readout strip between sections
 */

import { useEffect, useRef, useState } from 'react'

type DividerVariant = 'sector' | 'slash' | 'data'

interface SectionDividerProps {
  variant?:  DividerVariant
  className?: string
  label?:    string   // optional label shown on sector variant
}

// ─── SECTOR DIVIDER ───────────────────────────────────────────────────────────
const S_COLORS = ['#D82B0D', '#7C989E', '#9FA0C3']
const S_WIDTHS = ['34%', '41%', '25%']

function SectorDivider({ label }: { label?: string }) {
  const ref     = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex items-center w-full gap-[3px]" style={{ padding: '10px 0' }}>
      {S_COLORS.map((color, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', width: S_WIDTHS[i] }}>
          <div style={{
            height:     3,
            flex:       1,
            background: color,
            borderRadius: 2,
            transformOrigin: 'left center',
            transform:  vis ? 'scaleX(1)' : 'scaleX(0)',
            transition: `transform 0.38s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
            boxShadow:  vis ? `0 0 8px ${color}55` : 'none',
          }} />
        </div>
      ))}
      {label && (
        <span style={{
          fontFamily:    "'Alumni Sans', sans-serif",
          fontSize:      10,
          color:         'rgba(124,152,158,0.35)',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          marginLeft:    12,
          whiteSpace:    'nowrap',
          opacity:       vis ? 1 : 0,
          transition:    'opacity 0.35s ease 0.4s',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}

// ─── SLASH DIVIDER ────────────────────────────────────────────────────────────
function SlashDivider() {
  return (
    <div style={{ position: 'relative', width: '100%', height: 40, margin: '2px 0', overflow: 'hidden' }}>
      {/* Background gradient */}
      <div style={{
        position:   'absolute', inset: 0,
        background: 'linear-gradient(105deg, rgba(216,43,13,0.035) 0%, transparent 55%)',
      }} />

      {/* Main horizontal rule */}
      <div style={{
        position:   'absolute', top: '50%', left: 0, right: 0,
        height:     1,
        background: 'linear-gradient(90deg, #D82B0D 0%, rgba(216,43,13,0.4) 20%, rgba(124,152,158,0.12) 60%, transparent 100%)',
        transform:  'translateY(-50%)',
      }} />

      {/* Diagonal slash marks */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position:        'absolute',
          top:             0, bottom: 0,
          left:            `${6 + i * 9}px`,
          width:           '1px',
          background:      `rgba(216,43,13,${0.35 - i * 0.07})`,
          transform:       'skewX(-22deg)',
          transformOrigin: 'bottom',
        }} />
      ))}

      {/* Right fade line */}
      <div style={{
        position:   'absolute', top: '50%', right: 0,
        width:      '40%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,152,158,0.06))',
        transform:  'translateY(-50%)',
      }} />
    </div>
  )
}

// ─── DATA DIVIDER ─────────────────────────────────────────────────────────────
const DATA_ITEMS = [
  { text: 'THR 98%',     color: '#D82B0D'  },
  { text: 'BRK 0%',      color: '#7C989E'  },
  { text: 'RPM 12,850',  color: '#9FA0C3'  },
  { text: 'GEAR 7',      color: '#D82B0D'  },
  { text: 'SPD 318 KM/H',color: '#7C989E'  },
  { text: 'ERS 98%',     color: '#9FA0C3'  },
  { text: 'DRS OPEN',    color: '#22c55e'  },
  { text: 'LAP 24/57',   color: '#D82B0D'  },
  { text: 'GAP +2.341',  color: '#7C989E'  },
  { text: 'TYRE M 18L',  color: '#9FA0C3'  },
  { text: 'FUEL 42.1KG', color: '#D82B0D'  },
  { text: 'AIR 22°C',    color: '#7C989E'  },
]

function DataDivider() {
  // Double the items for seamless loop
  const items = [...DATA_ITEMS, ...DATA_ITEMS]

  return (
    <div style={{
      overflow:     'hidden',
      borderTop:    '1px solid rgba(124,152,158,0.1)',
      borderBottom: '1px solid rgba(124,152,158,0.08)',
      padding:      '7px 0',
      background:   'rgba(6,8,9,0.5)',
      margin:       '4px 0',
    }}>
      <div style={{
        display:   'flex',
        gap:       36,
        animation: 'data-scroll 22s linear infinite',
        whiteSpace:'nowrap',
        willChange:'transform',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{
            fontFamily:    "'Zen Dots', sans-serif",
            fontSize:      9,
            color:         item.color,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity:       0.55,
            flexShrink:    0,
          }}>
            {item.text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes data-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function SectionDivider({
  variant   = 'sector',
  className = '',
  label,
}: SectionDividerProps) {
  return (
    <div className={className}>
      {variant === 'sector' && <SectorDivider label={label} />}
      {variant === 'slash'  && <SlashDivider  />}
      {variant === 'data'   && <DataDivider   />}
    </div>
  )
}
