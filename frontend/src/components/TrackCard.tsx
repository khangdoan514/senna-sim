// ─── TRACK CARD ───────────────────────────────────────────────────────────────
// Drop-in replacement for the circuit selector buttons in Circuits.tsx.
//
// INTEGRATION — 3 steps in Circuits.tsx:
//
//   1. Import at the top:
//        import TracksGrid from '../components/TrackCard'
//
//   2. Replace the entire <div className={PANEL}> button block with:
//        <TracksGrid
//          circuits={ALL_CIRCUITS}
//          selectedId={selectedId}
//          onSelect={setSelectedId}
//        />
//
//   3. Keep everything below (SectionDivider, circuit header panel, etc.) as-is.
//      The existing detail panel already reads from `selectedId` so it just works.

import { useState } from 'react'

// ─── TYPES (mirror your Circuit interface exactly) ────────────────────────────
type Difficulty = 'High' | 'Medium' | 'Low'

interface Corner {
  num: number
  name: string
  type: string
  apexSpeed: string
  difficulty: Difficulty
}

interface WeatherEntry {
  session: string
  icon: string
  temp: string
}

interface Circuit {
  id: string
  name: string
  fullName: string
  country: string
  flag: string
  nextRace: string
  length: string
  turns: number
  lapRecord: string
  lapRecordHolder: string
  drsZones: number
  grip: number
  trackTemp: number
  rubberBuildup: 'High' | 'Medium' | 'Low'
  overtakingDifficulty: Difficulty
  tyreWear: 'High' | 'Medium' | 'Low'
  fuelLoad: 'High' | 'Medium' | 'Low'
  corners: Corner[]
  weather: WeatherEntry[]
  description: string
  lapRecordYear: number
}

// ─── CIRCUIT IMAGE MAP ────────────────────────────────────────────────────────
// Replace values with your actual local asset paths / imports.
const CIRCUIT_IMAGES: Record<string, string> = {
  australia:   '/images/circuits/australia.png',
  bahrain:     '/images/circuits/bahrain.png',
  jeddah:      '/images/circuits/jeddah.png',
  japan:       '/images/circuits/japan.png',
  china:       '/images/circuits/china.png',
  miami:       '/images/circuits/miami.png',
  imola:       '/images/circuits/imola.png',
  monaco:      '/images/circuits/monaco.png',
  spain:       '/images/circuits/spain.png',
  canada:      '/images/circuits/canada.png',
  austria:     '/images/circuits/austria.png',
  silverstone: '/images/circuits/silverstone.png',
  hungary:     '/images/circuits/hungary.png',
  spa:         '/images/circuits/spa.png',
  zandvoort:   '/images/circuits/zandvoort.png',
  monza:       '/images/circuits/monza.png',
  baku:        '/images/circuits/baku.png',
  singapore:   '/images/circuits/singapore.png',
  austin:      '/images/circuits/austin.png',
  mexico:      '/images/circuits/mexico.png',
  interlagos:  '/images/circuits/interlagos.png',
  lasvegas:    '/images/circuits/lasvegas.png',
  qatar:       '/images/circuits/qatar.png',
  abudhabi:    '/images/circuits/abudhabi.png',
}

// ─── SINGLE CARD ─────────────────────────────────────────────────────────────
function TrackCard({
  circuit: c,
  selected,
  onClick,
}: {
  circuit: Circuit
  selected: boolean
  onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  const img = CIRCUIT_IMAGES[c.id]

  // Two-line name treatment — mirrors DriverCard first/last name split
  const words = c.name.split(' ')
  const line1 = words[0]
  const line2 = words.slice(1).join(' ') || 'Grand Prix'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative rounded-xl cursor-none overflow-hidden transition-all duration-200"
      style={{
        background: '#161a1d',
        border: `1px solid ${
          selected
            ? '#e10600'
            : hov
            ? 'rgba(124,152,158,0.35)'
            : 'rgba(124,152,158,0.12)'
        }`,
        transform: selected
          ? 'translateY(-4px)'
          : hov
          ? 'translateY(-2px)'
          : 'none',
        boxShadow: selected
          ? '0 12px 32px rgba(225,6,0,0.35)'
          : hov
          ? '0 4px 16px rgba(124,152,158,0.10)'
          : 'none',
      }}
    >
      {/* Top colour stripe */}
      <div
        className="h-[5px] w-full"
        style={{ background: selected ? '#e10600' : 'rgba(225,6,0,0.35)' }}
      />

      {/* Circuit image */}
      {img && (
        <img
          src={img}
          alt={c.name}
          className="w-full object-cover block"
          style={{ aspectRatio: '16/9', background: '#0d1013' }}
          onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      )}

      {/* Card footer */}
      <div className="p-3 pb-4">
        {/* Country + flag */}
        <div className="flex justify-between items-center mb-1.5">
          <span
            className="font-['Alumni_Sans'] text-[11px] uppercase tracking-wider"
            style={{ color: selected ? '#e10600' : '#748386' }}
          >
            {c.country}
          </span>
          <span className="text-base">{c.flag}</span>
        </div>

        {/* Name */}
        <p className="font-['Alumni_Sans'] font-bold text-white text-[18px] leading-tight">
          {line1}
        </p>
        <p
          className="font-['Alumni_Sans'] font-bold text-[18px] leading-tight"
          style={{ color: selected ? '#e10600' : 'white' }}
        >
          {line2}
        </p>

        {/* Lap record pill — mirrors ELO pill on DriverCard */}
        <div
          className="mt-3 flex justify-between items-center rounded-md px-2 py-1.5"
          style={{
            background: selected
              ? 'rgba(225,6,0,0.10)'
              : 'rgba(124,152,158,0.06)',
            border: `1px solid ${
              selected ? 'rgba(225,6,0,0.35)' : 'rgba(124,152,158,0.15)'
            }`,
          }}
        >
          <span className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-wide">
            Lap record
          </span>
          <span
            className="font-['Zen_Dots'] text-[11px]"
            style={{ color: selected ? '#e10600' : '#9FA0C3' }}
          >
            {c.lapRecord}
          </span>
        </div>
      </div>

      {/* Selected diamond pointer — identical to DriverCard */}
      {selected && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
          style={{ background: '#e10600', boxShadow: '0 0 10px #e10600' }}
        />
      )}
    </div>
  )
}

// ─── GRID ─────────────────────────────────────────────────────────────────────
// Replaces the <div className="flex flex-wrap gap-2"> button block in Circuits.tsx
export default function TracksGrid({
  circuits,
  selectedId,
  onSelect,
}: {
  circuits: Circuit[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {circuits.map(c => (
        <TrackCard
          key={c.id}
          circuit={c}
          selected={selectedId === c.id}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  )
}