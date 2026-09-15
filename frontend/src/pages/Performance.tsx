/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERFORMANCE — src/pages/Performance.tsx
 * Route: /performance
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Head-to-head lap time comparison between any two drivers across a selected
 * race. Users pick Driver 1, Driver 2, and a race — lap times are plotted on
 * an SVG line chart and broken down lap-by-lap in a scrollable table.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Driver selector  — button grid for D1 and D2, plus race dropdown
 *  • Driver cards     — photo + team + best lap / avg lap / top speed per driver
 *  • Lap chart        — full-bleed SVG line chart with area fill and dot markers
 *  • Lap-by-lap table — per-lap times, delta bar, gap indicator, winner dot
 *  • Summary strip    — faster lap counts + overall edge for each driver
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/races?season=2026
 *    → string[]  (race name list for the selector dropdown)
 *    Replace: RACES constant below
 *
 *  GET /api/performance/profile?season=2026&driver=VER
 *    → { base, variance, bestLap, avgLap, topSpeed }
 *    Replace: MOCK_PROFILE record below — one entry per driver code
 *    Note: `base` and `variance` are used to seed the mock lap generator;
 *          with real data, replace buildLaps() with actual lap time arrays
 *
 *  GET /api/performance/laps?season=2026&race=Monaco+2024&driver=VER
 *    → { lap, ms, time }[]
 *    Replace: buildLaps() function — currently generates random laps from
 *             MOCK_PROFILE stats. Wire to this endpoint instead.
 *
 * ─── MOCK DATA TO REPLACE ────────────────────────────────────────────────────
 *  DRIVERS     — driver list with display colors (used for selector + chart)
 *  RACES       — race name list (selector options)
 *  MOCK_PROFILE — per-driver lap time parameters (best/avg/top speed + seed data)
 *  buildLaps() — random lap generator; replace with real API fetch on race change
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { PAGE, INNER, PANEL, BORDER, H1, H2, SUB_CARD } from '../components/layout'
import DRSSweep from '../components/DRSSweep'
import ScrollVelocity from '../components/ScrollVelocity'

// ─── DRIVER PHOTOS ────────────────────────────────────────────────────────────
const PHOTOS = import.meta.glob(
  '../assets/driverbios_photos/*',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>

function getPhotoUrl(photoId: string): string | null {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const hit = Object.entries(PHOTOS).find(([k]) => k.endsWith(`/${photoId}.${ext}`))
    if (hit) return hit[1]
  }
  return null
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

// Driver colors: same-team drivers share a hue but use distinct light/dark variants.
// No two drivers across different teams are visually similar.
const DRIVERS = [
  { code: 'VER', photoId: 'maxverstappen',   name: 'Max Verstappen',    team: 'Red Bull Racing', color: '#5588d8' },
  { code: 'HAD', photoId: 'isackhadjar',     name: 'Isack Hadjar',      team: 'Red Bull Racing', color: '#1f509a' },
  { code: 'NOR', photoId: 'landonorris',     name: 'Lando Norris',      team: 'McLaren',         color: '#ffa333' },
  { code: 'PIA', photoId: 'oscarpiastri',    name: 'Oscar Piastri',     team: 'McLaren',         color: '#cc6600' },
  { code: 'LEC', photoId: 'charlesleclerc',  name: 'Charles Leclerc',   team: 'Ferrari',         color: '#ff2848' },
  { code: 'HAM', photoId: 'lewishamilton',   name: 'Lewis Hamilton',    team: 'Ferrari',         color: '#b00022' },
  { code: 'RUS', photoId: 'georgerussell',   name: 'George Russell',    team: 'Mercedes',        color: '#55f7db' },
  { code: 'ANT', photoId: 'kimiantonelli',   name: 'Kimi Antonelli',    team: 'Mercedes',        color: '#1ab89d' },
  { code: 'ALO', photoId: 'fernandoalonso',  name: 'Fernando Alonso',   team: 'Aston Martin',    color: '#33bb88' },
  { code: 'STR', photoId: 'lancestroll',     name: 'Lance Stroll',      team: 'Aston Martin',    color: '#157050' },
  { code: 'SAI', photoId: 'carlossainz',     name: 'Carlos Sainz',      team: 'Williams',        color: '#3a82ea' },
  { code: 'ALB', photoId: 'alexalbon',       name: 'Alexander Albon',   team: 'Williams',        color: '#0f4faa' },
  { code: 'GAS', photoId: 'pierregasly',     name: 'Pierre Gasly',      team: 'Alpine',          color: '#33b8f0' },
  { code: 'COL', photoId: 'francocolapinto', name: 'Franco Colapinto',  team: 'Alpine',          color: '#0079b0' },
  { code: 'OCO', photoId: 'estebanocon',     name: 'Esteban Ocon',      team: 'Haas F1 Team',    color: '#eef0f1' },
  { code: 'BEA', photoId: 'oliverbearman',   name: 'Oliver Bearman',    team: 'Haas F1 Team',    color: '#b0b4b6' },
  { code: 'LAW', photoId: 'liamlawson',      name: 'Liam Lawson',       team: 'Racing Bulls',    color: '#88aaff' },
  { code: 'LIN', photoId: 'arvidlindblad',   name: 'Arvid Lindblad',    team: 'Racing Bulls',    color: '#4470e0' },
  { code: 'HUL', photoId: 'nicohulkenberg',  name: 'Nico Hulkenberg',   team: 'Audi',            color: '#ff5533' },
  { code: 'BOR', photoId: 'gabrielbortoleto',name: 'Gabriel Bortoleto', team: 'Audi',            color: '#cc2200' },
  { code: 'PER', photoId: 'checoperez',      name: 'Sergio Perez',      team: 'Cadillac',        color: '#c8c8cb' },
  { code: 'BOT', photoId: 'valterribottas',  name: 'Valtteri Bottas',   team: 'Cadillac',        color: '#7a7a7d' },
]

// ─── BACKEND INTEGRATION POINT ───────────────────────────────────────────────
// Replace RACES with a real API call:
//   const { races } = await fetch('/api/races?season=2026').then(r => r.json())
// ─────────────────────────────────────────────────────────────────────────────
const RACES = [
  'Bahrain 2024', 'Saudi Arabia 2024', 'Australia 2024', 'Japan 2024',
  'China 2024', 'Miami 2024', 'Monaco 2024', 'Canada 2024',
  'Spain 2024', 'Austria 2024', 'Silverstone 2024', 'Hungary 2024',
  'Belgium 2024', 'Netherlands 2024', 'Monza 2024', 'Singapore 2024',
]

// ─── BACKEND INTEGRATION POINT ───────────────────────────────────────────────
// Replace MOCK_PROFILE with a real API call:
//   const { data } = await fetch('/api/drivers/profiles?season=2026').then(r => r.json())
// Each driver entry should match: { base, variance, bestLap, avgLap, topSpeed }
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PROFILE: Record<string, { base: number; variance: number; bestLap: string; avgLap: string; topSpeed: string }> = {
  VER: { base: 74820, variance: 1200, bestLap: '1:13.971', avgLap: '1:14.820', topSpeed: '342 km/h' },
  HAD: { base: 75600, variance: 1800, bestLap: '1:14.910', avgLap: '1:15.600', topSpeed: '339 km/h' },
  NOR: { base: 74950, variance: 1300, bestLap: '1:14.101', avgLap: '1:14.950', topSpeed: '340 km/h' },
  PIA: { base: 75000, variance: 1400, bestLap: '1:14.230', avgLap: '1:15.000', topSpeed: '341 km/h' },
  LEC: { base: 75200, variance: 1500, bestLap: '1:14.455', avgLap: '1:15.200', topSpeed: '337 km/h' },
  HAM: { base: 75100, variance: 1400, bestLap: '1:14.302', avgLap: '1:15.100', topSpeed: '338 km/h' },
  RUS: { base: 75350, variance: 1350, bestLap: '1:14.610', avgLap: '1:15.350', topSpeed: '339 km/h' },
  ANT: { base: 75800, variance: 1800, bestLap: '1:15.200', avgLap: '1:15.800', topSpeed: '334 km/h' },
  ALO: { base: 75700, variance: 1700, bestLap: '1:15.010', avgLap: '1:15.700', topSpeed: '335 km/h' },
  STR: { base: 76000, variance: 1900, bestLap: '1:15.400', avgLap: '1:16.000', topSpeed: '333 km/h' },
  SAI: { base: 75500, variance: 1600, bestLap: '1:14.800', avgLap: '1:15.500', topSpeed: '336 km/h' },
  ALB: { base: 75900, variance: 1750, bestLap: '1:15.100', avgLap: '1:15.900', topSpeed: '335 km/h' },
  GAS: { base: 75850, variance: 1650, bestLap: '1:15.050', avgLap: '1:15.850', topSpeed: '336 km/h' },
  COL: { base: 76100, variance: 1850, bestLap: '1:15.300', avgLap: '1:16.100', topSpeed: '334 km/h' },
  OCO: { base: 76200, variance: 1800, bestLap: '1:15.450', avgLap: '1:16.200', topSpeed: '333 km/h' },
  BEA: { base: 76400, variance: 2000, bestLap: '1:15.700', avgLap: '1:16.400', topSpeed: '332 km/h' },
  LAW: { base: 76300, variance: 1900, bestLap: '1:15.600', avgLap: '1:16.300', topSpeed: '333 km/h' },
  LIN: { base: 76600, variance: 2100, bestLap: '1:15.900', avgLap: '1:16.600', topSpeed: '331 km/h' },
  HUL: { base: 76500, variance: 1850, bestLap: '1:15.800', avgLap: '1:16.500', topSpeed: '332 km/h' },
  BOR: { base: 76700, variance: 2000, bestLap: '1:16.000', avgLap: '1:16.700', topSpeed: '331 km/h' },
  PER: { base: 76000, variance: 1700, bestLap: '1:15.350', avgLap: '1:16.000', topSpeed: '334 km/h' },
  BOT: { base: 76200, variance: 1750, bestLap: '1:15.500', avgLap: '1:16.200', topSpeed: '333 km/h' },
}
const TOTAL_LAPS = 20

function buildLaps(code: string) {
  const p = MOCK_PROFILE[code]
  return Array.from({ length: TOTAL_LAPS }, (_, i) => {
    const ms  = p.base + (Math.random() - 0.48) * p.variance
    const sec = Math.round(ms) / 1000
    const m   = Math.floor(sec / 60)
    const s   = (sec % 60).toFixed(3).padStart(6, '0')
    return { lap: i + 1, ms, time: `${m}:${s}` }
  })
}

// ─── LAP CHART ────────────────────────────────────────────────────────────────

function LapChart({ laps1, laps2, c1, c2, d1Code, d2Code }: {
  laps1: { ms: number; time: string }[]
  laps2: { ms: number; time: string }[]
  c1: string
  c2: string
  d1Code: string
  d2Code: string
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const all   = [...laps1, ...laps2].map(l => l.ms)
  const minMs = Math.min(...all), maxMs = Math.max(...all), range = maxMs - minMs || 1
  const W = 700, H = 180, PL = 12, PR = 12, PT = 16, PB = 12
  const iW = W - PL - PR, iH = H - PT - PB, n = laps1.length
  const x  = (i: number) => PL + (i / (n - 1 || 1)) * iW
  const y  = (ms: number) => PT + iH - ((ms - minMs) / range) * iH

  const p1d = laps1.map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(l.ms).toFixed(1)}`).join(' ')
  const p2d = laps2.map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(l.ms).toFixed(1)}`).join(' ')

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect  = e.currentTarget.getBoundingClientRect()
    const svgX  = ((e.clientX - rect.left) / rect.width) * W
    let closest = 0, minDist = Infinity
    for (let i = 0; i < n; i++) {
      const d = Math.abs(svgX - x(i))
      if (d < minDist) { minDist = d; closest = i }
    }
    setHoverIdx(closest)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none"
      onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={PL} y1={PT + t * iH} x2={W - PR} y2={PT + t * iH}
          stroke="rgba(124,152,158,0.08)" strokeWidth="1" />
      ))}
      {laps1.map((_, i) => i > 0 && i < n - 1 && (
        <line key={i} x1={x(i)} y1={PT} x2={x(i)} y2={PT + iH}
          stroke="rgba(124,152,158,0.05)" strokeWidth="1" />
      ))}
      <path d={p1d + ` L${x(n - 1)},${PT + iH} L${x(0)},${PT + iH} Z`} fill={`${c1}14`} />
      <path d={p2d + ` L${x(n - 1)},${PT + iH} L${x(0)},${PT + iH} Z`} fill={`${c2}14`} />
      <path d={p2d} fill="none" stroke={c2} strokeWidth="2" opacity="0.7" strokeLinejoin="round" strokeLinecap="round" />
      <path d={p1d} fill="none" stroke={c1} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${c1}88)` }} />
      {laps1.map((l, i) => <circle key={i} cx={x(i)} cy={y(l.ms)} r="2.8" fill={c1} opacity="0.85" />)}
      {laps2.map((l, i) => <circle key={i} cx={x(i)} cy={y(l.ms)} r="2.2" fill={c2} opacity="0.7" />)}

      {hoverIdx !== null && (() => {
        const hx   = x(hoverIdx)
        const y1   = y(laps1[hoverIdx].ms)
        const y2   = y(laps2[hoverIdx].ms)
        const t1   = laps1[hoverIdx].time
        const t2   = laps2[hoverIdx].time
        const delta = (laps1[hoverIdx].ms - laps2[hoverIdx].ms) / 1000
        const d1faster = delta < 0
        const tipW = 130, tipH = 54
        const tipX = Math.min(Math.max(hx - tipW / 2, PL), W - PR - tipW)
        const tipY = PT - 4

        return (
          <g>
            <line x1={hx} y1={PT} x2={hx} y2={PT + iH}
              stroke="rgba(240,235,216,0.2)" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx={hx} cy={y1} r="4.5" fill={c1} stroke="#060708" strokeWidth="1.5" />
            <circle cx={hx} cy={y2} r="4.5" fill={c2} stroke="#060708" strokeWidth="1.5" />
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="5"
              fill="#0c0e10" stroke="rgba(124,152,158,0.3)" strokeWidth="0.75" opacity="0.97" />
            <text x={tipX + 8} y={tipY + 13}
              style={{ fontFamily: "'Alumni Sans',sans-serif", fontSize: 9, fill: 'rgba(159,160,195,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Lap {hoverIdx + 1}
            </text>
            <text x={tipX + 8} y={tipY + 26} style={{ fontFamily: "'Alumni Sans',sans-serif", fontSize: 11, fill: c1, fontWeight: 700 }}>
              {d1Code}  {t1}
            </text>
            <text x={tipX + 8} y={tipY + 39} style={{ fontFamily: "'Alumni Sans',sans-serif", fontSize: 11, fill: c2, fontWeight: 700 }}>
              {d2Code}  {t2}
            </text>
            <text x={tipX + tipW - 8} y={tipY + 33} textAnchor="end"
              style={{ fontFamily: "'Zen Dots',sans-serif", fontSize: 10, fill: d1faster ? c1 : c2, fontWeight: 700 }}>
              {d1faster ? `−${Math.abs(delta).toFixed(3)}` : `+${Math.abs(delta).toFixed(3)}`}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

// ─── ANIMATED HEADER ─────────────────────────────────────────────────────────

function AnimatedH2({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref         = useRef<HTMLDivElement>(null)
  const [vis, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex items-center gap-3">
      <div style={{
        height:     2,
        width:      vis ? 24 : 0,
        background: '#D82B0D',
        borderRadius: 2,
        transition: `width 0.32s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        boxShadow:  vis ? '0 0 8px #D82B0D' : 'none',
        flexShrink: 0,
      }} />
      <span className={H2} style={{
        opacity:    vis ? 1 : 0,
        transform:  vis ? 'translateX(0)' : 'translateX(-10px)',
        transition: `opacity 0.3s ease ${delay + 0.14}s, transform 0.3s ease ${delay + 0.14}s`,
      }}>
        {children}
      </span>
    </div>
  )
}

// ─── DRIVER HERO CARD ─────────────────────────────────────────────────────────

function DriverCard({ d, code, p }: { d: typeof DRIVERS[0]; code: string; p: typeof MOCK_PROFILE[string] }) {
  const ref         = useRef<HTMLDivElement>(null)
  const [vis, setV] = useState(false)
  const photoUrl    = getPhotoUrl(d.photoId)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative rounded-xl overflow-hidden"
      style={{
        background:    `linear-gradient(120deg,${d.color}18 0%,#111416 55%)`,
        border:        `1px solid ${d.color}33`,
        borderTop:     `3px solid ${d.color}`,
        opacity:        vis ? 1 : 0,
        transform:      vis ? 'translateY(0)' : 'translateY(16px)',
        transition:     'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Bold left accent */}
      <div style={{
        position:        'absolute',
        left:            0, top: 0, bottom: 0,
        width:           vis ? 4 : 0,
        background:      `linear-gradient(180deg, ${d.color} 0%, ${d.color}44 100%)`,
        transition:      'width 0.35s cubic-bezier(0.16,1,0.3,1) 0.1s',
        boxShadow:       vis ? `2px 0 12px ${d.color}44` : 'none',
      }} />

      <div className="relative p-5 pl-6 flex items-center gap-5">
        {/* Driver photo or code badge fallback */}
        <div
          className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-['Zen_Dots'] text-2xl"
          style={{ background: `${d.color}18`, border: `1.5px solid ${d.color}55`, color: d.color }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={d.name} className="w-full h-full object-cover object-top"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}/>
          ) : code}
        </div>
        <div className="flex-1">
          <p className="font-['Zen_Dots'] text-[16px] text-white font-normal">{d.name}</p>
          <p className="font-['Alumni_Sans'] text-[13px] text-[#9FA0C3]">{d.team}</p>
        </div>
        <div className="flex gap-5 text-right">
          {[
            { label: 'Best Lap',  value: p.bestLap  },
            { label: 'Avg Lap',   value: p.avgLap   },
            { label: 'Top Speed', value: p.topSpeed },
          ].map(s => (
            <div key={s.label}>
              <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-[1.5px] mb-0.5">{s.label}</p>
              <p className="font-['Alumni_Sans_Inline_One'] text-[18px] leading-none" style={{ color: d.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Performance() {
  const [d1Code, setD1Code] = useState('VER')
  const [d2Code, setD2Code] = useState('NOR')
  const [race,   setRace]   = useState('Monaco 2024')

  const d1 = DRIVERS.find(d => d.code === d1Code)!
  const d2 = DRIVERS.find(d => d.code === d2Code)!
  const p1 = MOCK_PROFILE[d1Code]
  const p2 = MOCK_PROFILE[d2Code]

  const laps1  = useMemo(() => buildLaps(d1Code), [d1Code, race])
  const laps2  = useMemo(() => buildLaps(d2Code), [d2Code, race])
  const deltas = laps1.map((l, i) => l.ms - laps2[i].ms)

  const selCls = "bg-[#1c2124] border border-[rgba(124,152,158,0.2)] rounded-lg px-3 py-1.5 font-['Alumni_Sans'] text-sm text-white outline-none cursor-none"

  return (
    <div className={PAGE}>

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      {/* ── Scroll velocity strip ────────────────────────────────────────── */}
      <ScrollVelocity
        baseSpeed={0.18}
        scrollStrength={3}
        style={{ borderTop: '2px solid #D82B0D', borderBottom: '1px solid rgba(124,152,158,0.2)', background: '#0c0e10' }}
        textStyle={{ color: 'rgba(240,235,216,0.25)' }}
      />

      <div className={INNER}>

        {/* Header */}
        <div className="text-right">
          <h1 className={H1}>Performance Analytics</h1>
          <p className="font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]">Head-to-head lap time comparison</p>
        </div>

        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className={`${PANEL} py-4`} style={{ background: 'linear-gradient(105deg,#111416 0%,rgba(124,152,158,0.04) 60%,#111416 100%)' }}>
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-[2px]">Driver 1</p>
              <div className="flex gap-1.5 flex-wrap">
                {DRIVERS.map(d => (
                  <button key={d.code} onClick={() => { if (d.code !== d2Code) setD1Code(d.code) }}
                    className="rounded-md px-3 py-1 font-['Zen_Dots'] text-[11px] transition-all duration-150"
                    style={{
                      border:     d.code === d1Code ? `1px solid ${d.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: d.code === d1Code ? `${d.color}22` : 'rgba(0,0,0,0.3)',
                      color:      d.code === d1Code ? d.color : '#748386',
                      opacity:    d.code === d2Code ? 0.25 : 1,
                      cursor:     d.code === d2Code ? 'not-allowed' : 'pointer',
                    }}>
                    {d.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="font-['Zen_Dots'] text-[22px] px-2" style={{ color: '#D82B0D', textShadow: '0 0 20px rgba(216,43,13,0.4)' }}>
              VS
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-[2px]">Driver 2</p>
              <div className="flex gap-1.5 flex-wrap">
                {DRIVERS.map(d => (
                  <button key={d.code} onClick={() => { if (d.code !== d1Code) setD2Code(d.code) }}
                    className="rounded-md px-3 py-1 font-['Zen_Dots'] text-[11px] transition-all duration-150"
                    style={{
                      border:     d.code === d2Code ? `1px solid ${d.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: d.code === d2Code ? `${d.color}22` : 'rgba(0,0,0,0.3)',
                      color:      d.code === d2Code ? d.color : '#748386',
                      opacity:    d.code === d1Code ? 0.25 : 1,
                      cursor:     d.code === d1Code ? 'not-allowed' : 'pointer',
                    }}>
                    {d.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-auto flex flex-col gap-1.5">
              <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-[2px]">Race</p>
              <select value={race} onChange={e => setRace(e.target.value)} className={selCls}>
                {RACES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className={BORDER} />
        </div>

        {/* ── Driver cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <DriverCard d={d1} code={d1Code} p={p1} />
          <DriverCard d={d2} code={d2Code} p={p2} />
        </div>

      </div>

      {/* ══ FULL-BLEED LAP CHART ════════════════════════════════════════════ */}
      {/* Breaks out of the INNER padding for a cinematic chart section */}
      <div style={{
        background:  'linear-gradient(180deg, #070809 0%, #060708 100%)',
        borderTop:    '1px solid rgba(124,152,158,0.1)',
        borderBottom: '1px solid rgba(124,152,158,0.1)',
        padding:      '40px 52px 40px 100px',
        position:     'relative',
        overflow:     'hidden',
      }}>
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />

        {/* Red glow behind chart */}
        <div style={{
          position:   'absolute',
          bottom:     0, left: '30%', right: '30%',
          height:     '60%',
          background: `radial-gradient(ellipse, ${d1.color}0a 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div className="relative">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <AnimatedH2>Lap Time Comparison — {race}</AnimatedH2>
            <div className="flex items-center gap-5">
              {[
                { code: d1Code, color: d1.color, name: d1.name },
                { code: d2Code, color: d2.color, name: d2.name },
              ].map(x => (
                <span key={x.code} className="flex items-center gap-2">
                  <span className="w-6 h-0.5 rounded" style={{ background: x.color }} />
                  <span className="font-['Zen_Dots'] text-[11px]" style={{ color: x.color }}>{x.code}</span>
                  <span className="font-['Alumni_Sans'] text-[12px] text-[#748386]">{x.name.split(' ').pop()}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(4,5,6,0.8)', border: '1px solid rgba(124,152,158,0.07)' }}>
            <LapChart laps1={laps1} laps2={laps2} c1={d1.color} c2={d2.color} d1Code={d1Code} d2Code={d2Code} />
          </div>

          {/* Lap labels */}
          <div className="flex justify-between px-4 mt-2">
            {Array.from({ length: TOTAL_LAPS }, (_, i) => i + 1)
              .filter((_, i) => i === 0 || i === 4 || i === 9 || i === 14 || i === TOTAL_LAPS - 1)
              .map(n => (
                <span key={n} className="font-['Alumni_Sans'] text-[10px] text-[#748386]">L{n}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Back into normal inner layout for the table */}
      <div className={INNER}>

        {/* ── Lap table ───────────────────────────────────────────────── */}
        <div className={PANEL}>
          <div className="flex items-center justify-between mb-4">
            <AnimatedH2>Lap-by-Lap Breakdown</AnimatedH2>
          </div>

          <div className="grid grid-cols-[48px_1fr_100px_100px_1fr_48px] gap-2 px-4 pb-3 border-b border-[rgba(124,152,158,0.1)]">
            {['Lap', '', 'Gap', 'Δ', '', ''].map((h, i) => (
              <span
                key={i}
                className="font-['Alumni_Sans'] text-[10px] uppercase tracking-[1px]"
                style={{
                  color:     i === 1 ? d1.color : i === 4 ? d2.color : '#748386',
                  textAlign: i === 4 || i === 5 ? 'right' : undefined,
                }}
              >
                {i === 1 ? d1Code : i === 4 ? d2Code : h}
              </span>
            ))}
          </div>

          <div className="relative">
          <div className="flex flex-col divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto">
            {laps1.map((lap, i) => {
              const l2     = laps2[i]
              const delta  = lap.ms - l2.ms
              const d1Win  = delta < 0
              const abs    = (Math.abs(delta) / 1000).toFixed(3)

              return (
                <div
                  key={i}
                  className="grid grid-cols-[48px_1fr_100px_100px_1fr_48px] gap-2 px-4 py-[9px] items-center transition-colors"
                  style={{ background: d1Win ? `${d1.color}06` : `${d2.color}06` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = d1Win ? `${d1.color}06` : `${d2.color}06` }}
                >
                  <span className="font-['Zen_Dots'] text-[11px] text-[#748386]">{lap.lap}</span>
                  <span className="font-['Alumni_Sans'] text-[13px] font-semibold" style={{ color: d1Win ? d1.color : '#9FA0C3' }}>{lap.time}</span>
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(124,152,158,0.08)' }}>
                    <div className="absolute h-full rounded-full" style={{
                      width:     `${Math.min(Math.abs(delta) / 1500 * 100, 100)}%`,
                      background: d1Win ? d1.color : d2.color,
                      left:       d1Win ? '50%' : undefined,
                      right:      d1Win ? undefined : '50%',
                      transform:  d1Win ? 'translateX(-100%)' : 'none',
                    }} />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(124,152,158,0.25)' }} />
                  </div>
                  <span className="font-['Zen_Dots'] text-[11px] text-center" style={{ color: d1Win ? d1.color : d2.color }}>
                    {d1Win ? `−${abs}` : `+${abs}`}
                  </span>
                  <span className="font-['Alumni_Sans'] text-[13px] font-semibold text-right" style={{ color: d1Win ? '#9FA0C3' : d2.color }}>
                    {l2.time}
                  </span>
                  <div className="flex justify-end">
                    <div className="w-2 h-2 rounded-full" style={{
                      background: d1Win ? d1.color : d2.color,
                      boxShadow:  `0 0 5px ${d1Win ? d1.color : d2.color}`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          {/* Fade-out gradient at bottom of scrollable table */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #111416 0%, transparent 100%)' }}/>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-[rgba(124,152,158,0.1)] grid grid-cols-3 gap-4">
            {(() => {
              const d1Wins   = deltas.filter(d => d < 0).length
              const avgDelta = deltas.reduce((a, b) => a + b, 0) / TOTAL_LAPS
              const faster   = avgDelta < 0 ? d1 : d2
              return [
                { label: `${d1Code} faster laps`, value: `${d1Wins} / ${TOTAL_LAPS}`,         color: d1.color },
                { label: `${d2Code} faster laps`, value: `${TOTAL_LAPS - d1Wins} / ${TOTAL_LAPS}`, color: d2.color },
                { label: 'Overall edge',           value: faster.code,                          color: faster.color },
              ]
            })().map(s => (
              <div key={s.label} className={`${SUB_CARD} text-center`}>
                <p className="font-['Alumni_Sans_Inline_One'] text-[26px] leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="font-['Alumni_Sans'] text-[11px] text-[#748386] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className={BORDER} />
        </div>

      </div>
    </div>
  )
}