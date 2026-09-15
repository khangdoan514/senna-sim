/**
 * 🕐 LAP TICKER — animated lap time display like an F1 timing board
 */

import { useEffect, useState } from 'react'

interface Lap {
  lap:    number
  time:   string
  delta:  string
  flag:   'purple' | 'green' | 'yellow' | 'red'
}

interface LapTickerProps {
  laps?:       Lap[]
  driverName?: string
  maxVisible?: number
}

const DEMO_LAPS: Lap[] = [
  { lap:1,  time:'1:16.042', delta:'+1.221', flag:'yellow' },
  { lap:2,  time:'1:14.988', delta:'+0.167', flag:'yellow' },
  { lap:3,  time:'1:14.821', delta:'—',      flag:'purple' },
  { lap:4,  time:'1:14.903', delta:'+0.082', flag:'green'  },
  { lap:5,  time:'1:15.211', delta:'+0.390', flag:'yellow' },
  { lap:6,  time:'1:15.102', delta:'+0.281', flag:'yellow' },
  { lap:7,  time:'1:14.856', delta:'+0.035', flag:'green'  },
  { lap:8,  time:'1:17.421', delta:'+2.600', flag:'red'    },
  { lap:9,  time:'1:14.872', delta:'+0.051', flag:'green'  },
  { lap:10, time:'1:14.833', delta:'+0.012', flag:'green'  },
]

const FLAG_COLORS: Record<string, string> = {
  purple: '#bf00ff',
  green:  '#00d700',
  yellow: '#ffcc00',
  red:    '#ff3333',
}

const FLAG_BG: Record<string, string> = {
  purple: 'rgba(191,0,255,0.1)',
  green:  'rgba(0,215,0,0.08)',
  yellow: 'rgba(255,204,0,0.06)',
  red:    'rgba(255,51,51,0.1)',
}

export default function LapTicker({ laps = DEMO_LAPS, driverName = 'VER', maxVisible = 7 }: LapTickerProps) {
  const [visible, setVisible] = useState<Lap[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx >= laps.length) return
    const t = setTimeout(() => {
      setVisible(prev => [laps[idx], ...prev].slice(0, maxVisible))
      setIdx(i => i + 1)
    }, 600)
    return () => clearTimeout(t)
  }, [idx, laps, maxVisible])

  return (
    <div className="bg-black/60 rounded-[10px] overflow-hidden border border-[rgba(220,47,2,0.3)]">

      {/* Header */}
      <div className="bg-[#0a0a0a] px-[14px] py-2 flex justify-between items-center border-b border-[rgba(220,47,2,0.3)]">
        <span className="font-['Zen_Dots'] text-xs text-[#e10600]">LAP TIMES</span>
        <span className="font-['Alumni_Sans'] text-sm text-white font-bold tracking-[2px]">{driverName}</span>
        <span className="font-['Alumni_Sans'] text-[11px] text-[#99a1af]">
          {visible.length}/{laps.length} laps
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_80px_70px] px-[14px] py-1.5 border-b border-white/[0.06]">
        {['LAP', 'TIME', 'DELTA', ''].map(h => (
          <span key={h} className="font-['Alumni_Sans'] text-[10px] text-[rgba(153,161,175,0.6)] tracking-[1px]">{h}</span>
        ))}
      </div>

      {/* Lap rows */}
      <div style={{ minHeight: maxVisible * 34 }}>
        {visible.map((lap, i) => (
          <div
            key={lap.lap}
            className="grid grid-cols-[40px_1fr_80px_70px] px-[14px] py-[7px] items-center border-b border-white/[0.04]"
            style={{
              background: i === 0 ? FLAG_BG[lap.flag] : 'transparent',
              animation:  i === 0 ? 'lap-slide-in 0.3s ease' : 'none',
            }}
          >
            <span className="font-['Alumni_Sans'] text-[13px] text-[#99a1af]">{lap.lap}</span>
            <span
              className="font-['Zen_Dots'] text-[13px]"
              style={{ color: i === 0 ? FLAG_COLORS[lap.flag] : '#fff' }}
            >
              {lap.time}
            </span>
            <span
              className="font-['Alumni_Sans'] text-[13px]"
              style={{
                color: lap.delta.startsWith('-')
                  ? '#22c55e'
                  : lap.delta === '—'
                    ? FLAG_COLORS.purple
                    : '#99a1af',
              }}
            >
              {lap.delta}
            </span>
            {/* Flag dot */}
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: FLAG_COLORS[lap.flag],
                boxShadow:  i === 0 ? `0 0 8px ${FLAG_COLORS[lap.flag]}` : 'none',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes lap-slide-in {
          from { opacity:0; transform:translateY(-8px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}
