/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIMULATION — src/pages/Simulation.tsx
 * Route: /simulation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Two-tab page combining race replay visualisation and what-if scenario
 * modelling. The Race Simulation tab renders a live track map with animated
 * driver dots, a position tower, speed gauge, and podium. The What-If tab
 * lets users tweak variables (weather, safety car, grid order) and re-run
 * a stochastic simulation outcome.
 *
 * ─── TABS ────────────────────────────────────────────────────────────────────
 *  Race Simulation tab:
 *    · Session selector  — year + round dropdowns to pick the race
 *    · Track canvas      — Canvas2D rendering of track outline + driver dots
 *                          (RaceCanvas component, driven by trackMap + positions)
 *    · Position tower    — live gap/position strip updating each sim frame
 *    · Speed gauge       — RPM arc gauge showing selected driver's speed
 *    · Podium block      — P1/P2/P3 driver display
 *    · Race info strip   — event name, lap count, driver count
 *
 *  What-If Scenarios tab:
 *    · Presets (rain chaos, undercut, safe one-stop), race + condition dropdowns
 *    · Race-control snapshot (actual vs model), impact meter, movement ribbons
 *    · Data + scoring in ../lib/whatIfHistorical.ts (hardcoded; swap for API later)
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/simulation/session?year=2024&round=6
 *    → SessionInfo  { event_name, total_laps, duration_s, driver_count }
 *    Replace: sessionInfo state (currently null until a session is loaded)
 *
 *  GET /api/simulation/frames?year=2024&round=6
 *    → SimFrame[]  { frame, t, progress, lap, total_laps, positions[] }
 *    Replace: the demo frame playback driven by DEMO_POSITIONS below.
 *    The frontend expects frames at regular intervals and drives position
 *    by interpolating x/y from consecutive frames.
 *
 *  GET /api/simulation/track-map?year=2024&round=6
 *    → TrackMap  { x[], y[], rotation }   (normalised 0–1000 coordinate space)
 *    Replace: trackMap state (currently null, showing placeholder ellipse)
 *
 *  POST /api/simulation/what-if
 *    Body: { year, round, weather, safetyCarProb, gridOffset, ... }
 *    → { outcomes: { driver, winPct, podiumPct }[] }
 *    Replace: What-If tab results (currently static mock percentages)
 *
 * ─── MOCK DATA TO REPLACE ────────────────────────────────────────────────────
 *  DEMO_POSITIONS   — 20 driver entries with static x:0/y:0 coordinates
 *                     (used when no session is loaded; dots all stack at origin)
 *  YEARS / ROUNDS   — selector options; YEARS can stay static, ROUNDS from API
 *  SessionInfo      — populated by the load-session call above
 *
 * ─── HOW THE TRACK CANVAS WORKS ──────────────────────────────────────────────
 *  RaceCanvas receives `trackMap` (x[], y[] arrays in 0-1000 space) and draws
 *  the circuit outline using Canvas2D. Driver dots are placed at their x/y
 *  coordinates from the positions array. When trackMap is null it falls back
 *  to a generic ellipse with a "Load session" message.
 *  All canvas drawing is inside a useEffect that re-runs when trackMap or
 *  positions change — no RAF loop, just re-render on data update.
 */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { PAGE, INNER, PANEL, BORDER, H1, H2, META, SIMULATION_SESSION_SURFACE } from '../components/layout'
import DRSSweep from '../components/DRSSweep'
import SectionDivider from '../components/SectionDivider'
import F1ReplayRoot, { type F1SessionFormRenderProps } from '../f1Replay/F1ReplayRoot'
import { simulationYearsDescending } from '../lib/simulationSchedule'
import {
  computeScenarioFromFinishGrid,
  getLeaderFinishSecondsFromGrid,
  whatIfScenarioTotalTimeDisplay,
} from '../lib/whatIfFromSession'
import { parseFinishClockToSeconds } from '../lib/raceLeaderboardDisplay'
import {
  WHAT_IF_SC_OPTIONS,
  WHAT_IF_STRATEGY_OPTIONS,
  WHAT_IF_TYRE_OPTIONS,
  WHAT_IF_WEATHER_OPTIONS,
  type LeaderboardFinishRow,
  type WhatIfOutcome,
  type WhatIfSafetyCar,
  type WhatIfStrategy,
  type WhatIfTyre,
  type WhatIfWeather,
} from '../lib/whatIfHistorical'





//----------------------------DropDown--------------------------------
type DropdownOption<T extends string | number> = { value: T; label: string }

function DropdownDown<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: DropdownOption<T>[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative z-20 w-full min-w-0">
      {/* Trigger button — looks identical to your existing selects */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={className}
        style={{
          display: 'flex',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          textAlign: 'left',
        }}
      >
        <span className="min-w-0 flex-1 whitespace-nowrap text-left">{selected?.label ?? '—'}</span>
        <span
          className="shrink-0 text-[10px] leading-none text-[#748386]"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ▾
        </span>
      </button>

      {/* Dropdown list — always opens DOWNWARD */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',   // ← below the button, never above
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#161a1d',
          border: '1px solid rgba(220,47,2,0.35)',
          borderRadius: 8,
          maxHeight: 260,
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map((o) => (
            <div
              key={String(o.value)}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 16,
                fontFamily: "'Alumni Sans', sans-serif",
                color: o.value === value ? '#e10600' : '#d1d5dc',
                background: o.value === value ? 'rgba(225,6,0,0.08)' : 'transparent',
                borderLeft: o.value === value ? '2px solid #e10600' : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (o.value !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                if (o.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── TYPES ───────────────────────────────────────────────────────────────────
interface DriverPosition {
  pos: number; code: string; team: string; color: string
  x: number; y: number; speed: number; gear: number; lap: number; gap: string
}
interface SimFrame {
  frame: number; t: number; progress: number; lap: number
  total_laps: number; positions: DriverPosition[]
}
interface TrackMap   { x: number[]; y: number[]; rotation: number }
interface SessionInfo { event_name: string; total_laps: number; duration_s: number; driver_count: number }

const YEARS = simulationYearsDescending()

const SESSION_TYPE_OPTIONS: DropdownOption<string>[] = [
  { value: 'R', label: 'Race' },
  { value: 'Q', label: 'Qualifying' },
  { value: 'S', label: 'Sprint' },
]

const SESSION_SELECT_CLS =
  "w-full py-[9px] px-3 rounded-lg bg-[#161a1d] border border-[rgba(85, 65, 60, 0.4)] text-white text-[17px] font-['Alumni_Sans'] outline-none"

const LB_POS_UP = '#86efac'
const LB_POS_DOWN = '#fca5a5'
/** Scenario “P(new pos.)” / slot % column. */
const LB_SCENARIO_SLOT = '#a5b4fc'
/** TIME em dash when classified P10–P20 had no race clock — muted vs slot %. */
const LB_SCENARIO_TIME_DASH = '#748386'

/** When opening the What If tab, align session picker with Japan 2024 (calendar R4). */
const WHAT_IF_TAB_SESSION_YEAR = 2024
const WHAT_IF_TAB_SESSION_ROUND = 4

const WHAT_IF_LOAD_MS = 3000
/** After results load, scenario grid stays identical to actual for this long, then morph begins. */
const WHAT_IF_SCENARIO_HOLD_MS = 2000
const WHAT_IF_SCENARIO_ANIM_MS = 2800
/** Slightly slower than race leaderboard to emphasize scenario swaps. */
const SCENARIO_ROW_FLIP_MS = 1800

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Morph scenario order from actual (t≈0) to final scenario (t≈1) by blending sort keys.
 * Row data stays from `actualRows` (telemetry); slot % fades in near the end.
 */
function interpolateScenarioLeaderboard(
  actualRows: LeaderboardFinishRow[],
  scenarioFinal: LeaderboardFinishRow[],
  tRaw: number,
  scenarioLocked?: boolean
): LeaderboardFinishRow[] {
  const leaderFinishSec = getLeaderFinishSecondsFromGrid(actualRows)
  const t = easeInOutCubic(Math.min(1, Math.max(0, tRaw)))
  const scenByCode = new Map(scenarioFinal.map((r) => [r.code, r]))
  const scenIdx = new Map(scenarioFinal.map((r, i) => [r.code, i]))
  const keyed = actualRows.map((a) => {
    const sf = scenByCode.get(a.code)
    if (!sf) return { code: a.code, sortKey: a.pos, tie: 999 }
    const sortKey = a.pos * (1 - t) + sf.pos * t
    return { code: a.code, sortKey, tie: scenIdx.get(a.code) ?? 0 }
  })
  keyed.sort((u, v) => (u.sortKey === v.sortKey ? u.tie - v.tie : u.sortKey - v.sortKey))
  return keyed.map((k, i) => {
    const a = actualRows.find((r) => r.code === k.code)!
    const sf = scenByCode.get(a.code)
    const pos = i + 1
    const slotPct = t >= 0.9 && sf?.slotPct != null ? sf.slotPct : undefined
    const scen = scenarioLocked === true ? sf : undefined
    return {
      ...a,
      pos,
      team: a.team ?? sf?.team,
      name: a.name || sf?.name || a.code,
      timeDisplay:
        scen != null
          ? (scen.timeDisplay ?? whatIfScenarioTotalTimeDisplay(a, leaderFinishSec))
          : whatIfScenarioTotalTimeDisplay(a, leaderFinishSec),
      finish_time_seconds:
        scen != null
          ? typeof scen.finish_time_seconds === 'number' && Number.isFinite(scen.finish_time_seconds)
            ? scen.finish_time_seconds
            : scen.finish_time_seconds == null
              ? null
              : a.finish_time_seconds
          : a.finish_time_seconds,
      slotPct,
    }
  })
}

function ScenarioLeaderboardSkeleton({ rowCount }: { rowCount: number }) {
  const n = Math.max(4, Math.min(rowCount || 12, 24))
  return (
    <div className="rounded-lg border border-[rgba(124,152,158,0.12)] bg-[#14181b]">
      <div className="flex items-center justify-center gap-2 border-b border-[rgba(124,152,158,0.15)] py-4">
        <i className="fa-solid fa-circle-notch fa-spin text-[#9FA0C3] text-lg" />
        <span className="font-['Alumni_Sans'] text-[15px] text-[#c4c8d4]">Running scenario model…</span>
      </div>
      <div className="animate-pulse space-y-2.5 p-4">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-10 shrink-0 rounded bg-[rgba(124,152,158,0.14)]" />
            <div className="h-4 w-12 shrink-0 rounded bg-[rgba(124,152,158,0.12)]" />
            <div className="h-4 flex-1 rounded bg-[rgba(124,152,158,0.1)]" />
            <div className="h-4 w-20 shrink-0 rounded bg-[rgba(124,152,158,0.1)]" />
          </div>
        ))}
      </div>
      <p className="font-['Alumni_Sans'] text-[12px] text-[#64748b] text-center pb-3">Scoring weather, tyres, and safety-car bias on the full grid…</p>
    </div>
  )
}

/** Current F1 race points for classified finishers P1–P10 (P11+ = 0). */
const F1_RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const

function pointsForClassifiedPosition(pos: number): number {
  if (pos < 1 || pos > F1_RACE_POINTS.length) return 0
  return F1_RACE_POINTS[pos - 1]!
}

function fmtLbCell(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '—'
  return String(v)
}

function leaderboardFinishSeconds(r: LeaderboardFinishRow): number | null {
  const raw = r.finish_time_seconds
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw
  }
  const fromDisplay = parseFinishClockToSeconds(r.timeDisplay ?? undefined)
  if (fromDisplay != null && Number.isFinite(fromDisplay) && fromDisplay > 0) {
    return fromDisplay
  }
  return null
}

/** True when scenario modeled race clock is strictly slower than the same driver’s actual classified clock. */
function scenarioTimeIncreasedVsActual(
  scenarioRow: LeaderboardFinishRow,
  actualByCode: Map<string, LeaderboardFinishRow>
): boolean {
  const act = actualByCode.get(scenarioRow.code)
  if (!act) return false
  const s = leaderboardFinishSeconds(scenarioRow)
  const a = leaderboardFinishSeconds(act)
  if (s == null) return false
  if (a == null) return false
  return s > a + 1e-3
}

function ClassifiedLeaderboardTable({
  rows,
  variant,
  actualPositionByCode,
  flipRowAnimation,
  actualLeaderboardForTimeCompare,
}: {
  rows: LeaderboardFinishRow[]
  variant: 'actual' | 'scenario'
  /** Actual classified position by driver code — used on scenario grid for ▲/▼ vs actual. */
  actualPositionByCode?: Record<string, number>
  /** FLIP-style translateY on table rows when driver order changes (same idea as the race leaderboard). */
  flipRowAnimation?: boolean
  /** Left “classified” rows — compare race clock vs scenario TIME (red + ↑ when slower). */
  actualLeaderboardForTimeCompare?: LeaderboardFinishRow[]
}) {
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map())
  const prevTopByCodeRef = useRef<Map<string, number>>(new Map())
  const flipCleanupRef = useRef<number | null>(null)
  const orderSig = useMemo(() => rows.map((r) => r.code).join('|'), [rows])
  const actualByCode = useMemo(() => {
    if (!actualLeaderboardForTimeCompare?.length) return null
    return new Map(actualLeaderboardForTimeCompare.map((r) => [r.code, r] as const))
  }, [actualLeaderboardForTimeCompare])

  useLayoutEffect(() => {
    if (!flipRowAnimation || variant !== 'scenario' || !rows.length) return

    if (flipCleanupRef.current != null) {
      window.clearTimeout(flipCleanupRef.current)
      flipCleanupRef.current = null
    }

    rows.forEach((row) => {
      const el = rowRefs.current.get(row.code)
      if (!el) return
      el.style.transition = ''
      el.style.transform = ''
    })

    const prevTop = prevTopByCodeRef.current
    const nextTop = new Map<string, number>()
    const moving: Array<{ el: HTMLTableRowElement; dy: number }> = []

    rows.forEach((row) => {
      const el = rowRefs.current.get(row.code)
      if (!el) return
      const top = el.getBoundingClientRect().top
      nextTop.set(row.code, top)
      const before = prevTop.get(row.code)
      if (before == null) return
      const dy = before - top
      if (Math.abs(dy) < 0.5) return
      moving.push({ el, dy })
    })

    if (moving.length) {
      moving.forEach(({ el, dy }) => {
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
      })
      void document.body.offsetHeight
      moving.forEach(({ el }) => {
        el.style.transition = `transform ${SCENARIO_ROW_FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        el.style.transform = 'translateY(0)'
      })
      flipCleanupRef.current = window.setTimeout(() => {
        rowRefs.current.forEach((el) => {
          if (!el) return
          el.style.transition = ''
          el.style.transform = ''
        })
        flipCleanupRef.current = null
      }, SCENARIO_ROW_FLIP_MS + 60)
    }

    prevTopByCodeRef.current = nextTop
  }, [orderSig, flipRowAnimation, variant, rows.length])

  useEffect(() => {
    return () => {
      if (flipCleanupRef.current != null) {
        window.clearTimeout(flipCleanupRef.current)
        flipCleanupRef.current = null
      }
    }
  }, [])

  return (
    <div className="rounded-lg border border-[rgba(124,152,158,0.12)] overflow-visible">
      <table className="w-full min-w-[38rem] text-left border-collapse font-['Alumni_Sans'] text-[15px] text-[#e5e7eb]">
        <thead className="border-b border-[rgba(124,152,158,0.22)] bg-[#14181b]">
          <tr className="text-[12px] uppercase tracking-[0.08em] text-[#9FA0C3]">
            <th className="py-3 px-3 font-semibold">POS.</th>
            <th className="py-3 pl-4 pr-3 font-semibold">NO.</th>
            <th className="py-3 pl-5 pr-3 font-semibold">DRIVER</th>
            <th className="py-3 pl-7 pr-3 font-semibold">TEAM</th>
            <th className="py-3 pl-3 pr-8 text-right font-semibold">LAPS</th>
            <th className="py-3 pl-12 pr-3 font-semibold">TIME</th>
            <th className="py-3 px-3 text-right font-semibold">{variant === 'scenario' ? 'P(new pos.)' : 'PTS'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rawC = row.color?.trim()
            const codeColor =
              rawC && rawC.length > 0 ? (rawC.startsWith('#') ? rawC : `#${rawC}`) : '#e5e7eb'
            const actualPos = actualPositionByCode?.[row.code]
            const actRowForClock = actualByCode?.get(row.code)
            const actClockSec = actRowForClock != null ? leaderboardFinishSeconds(actRowForClock) : null
            const scenClockSec = leaderboardFinishSeconds(row)
            const scenHasClock = scenClockSec != null
            const actualBand1020 = actualPos != null && actualPos >= 10 && actualPos <= 20
            const actualNoRaceClock = actClockSec == null
            /** P10–P20 classified with no official clock and scenario also shows no time — muted em dash. */
            const scenarioDashOnlyP1020 =
              variant === 'scenario' && actualBand1020 && actualNoRaceClock && !scenHasClock
            const scenarioDelta =
              variant === 'scenario' && actualPos != null && actualPos !== row.pos
                ? row.pos < actualPos
                  ? 'up'
                  : 'down'
                : 'same'
            let posStyle: CSSProperties = { color: '#9FA0C3' }
            let posSuffix: ReactNode = null
            let timeStyle: CSSProperties =
              variant === 'scenario' ? { color: LB_SCENARIO_SLOT } : { color: '#cbd5e1' }
            let timeSuffix: ReactNode = null
            if (scenarioDelta === 'up') {
              posStyle = { color: LB_POS_UP }
              posSuffix = <span className="ml-1 inline-block translate-y-px">▲</span>
            } else if (scenarioDelta === 'down') {
              posStyle = { color: LB_POS_DOWN }
              posSuffix = <span className="ml-1 inline-block translate-y-px">▼</span>
            }
            const timeIncreased =
              variant === 'scenario' &&
              actualByCode != null &&
              !scenarioDashOnlyP1020 &&
              scenarioTimeIncreasedVsActual(row, actualByCode)
            if (scenarioDashOnlyP1020) {
              timeStyle = { color: LB_SCENARIO_TIME_DASH }
              timeSuffix = null
            } else if (timeIncreased) {
              timeStyle = { color: LB_POS_DOWN }
              timeSuffix = (
                <span className="ml-1 inline-block translate-y-px" style={{ color: LB_POS_DOWN }} aria-hidden>
                  ▼
                </span>
              )
            }
            const rowKey =
              flipRowAnimation && variant === 'scenario' ? row.code : `${variant}-${row.code}-${row.pos}`
            return (
            <tr
              key={rowKey}
              ref={(el) => {
                if (flipRowAnimation && variant === 'scenario') {
                  if (el) rowRefs.current.set(row.code, el)
                  else rowRefs.current.delete(row.code)
                }
              }}
              className="border-b border-[rgba(124,152,158,0.07)] hover:bg-[rgba(255,255,255,0.02)]"
            >
              <td className="py-2.5 px-3 tabular-nums font-semibold" style={posStyle}>
                <span>{row.pos}</span>
                {posSuffix}
              </td>
              <td className="py-2.5 pl-4 pr-3 tabular-nums text-[#cbd5e1]">{fmtLbCell(row.carNo)}</td>
              <td
                className="py-2.5 pl-5 pr-3 font-['Zen_Dots'] text-[14px]"
                style={{ color: codeColor, textShadow: '0 0 12px rgba(0,0,0,0.65)' }}
                title={row.name}
              >
                {row.code}
              </td>
              <td className="py-2.5 pl-7 pr-3 max-w-[12rem] truncate text-[#d1d5dc]" title={row.team}>
                {fmtLbCell(row.team)}
              </td>
              <td className="py-2.5 pl-3 pr-8 text-right tabular-nums">{row.laps != null ? row.laps : '—'}</td>
              <td
                className={`py-2.5 pl-12 pr-3 tabular-nums font-semibold overflow-visible whitespace-nowrap ${
                  variant === 'scenario' ? '' : 'text-[#cbd5e1]'
                }`}
                style={variant === 'scenario' ? timeStyle : undefined}
              >
                <span className="inline-flex items-baseline gap-0">
                  <span>{row.timeDisplay ?? '—'}</span>
                  {timeSuffix}
                </span>
              </td>
              <td
                className="py-2.5 px-3 text-right tabular-nums font-['Zen_Dots'] text-[14px]"
                style={{ color: LB_SCENARIO_SLOT }}
              >
                {variant === 'scenario' && row.slotPct != null ? `${row.slotPct}%` : pointsForClassifiedPosition(row.pos)}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const DEMO_POSITIONS: DriverPosition[] = [
  { pos:1,  code:'VER', team:'Red Bull Racing', color:'#5588d8', x:0, y:0, speed:312, gear:7, lap:42, gap:'Leader'  },
  { pos:2,  code:'NOR', team:'McLaren',         color:'#ffa333', x:0, y:0, speed:308, gear:7, lap:42, gap:'+4.2s'   },
  { pos:3,  code:'LEC', team:'Ferrari',         color:'#ff2848', x:0, y:0, speed:305, gear:6, lap:42, gap:'+8.7s'   },
  { pos:4,  code:'HAM', team:'Ferrari',         color:'#b00022', x:0, y:0, speed:301, gear:7, lap:42, gap:'+14.1s'  },
  { pos:5,  code:'RUS', team:'Mercedes',        color:'#55f7db', x:0, y:0, speed:299, gear:6, lap:42, gap:'+19.3s'  },
  { pos:6,  code:'SAI', team:'Williams',        color:'#3a82ea', x:0, y:0, speed:297, gear:7, lap:42, gap:'+25.8s'  },
  { pos:7,  code:'PIA', team:'McLaren',         color:'#cc6600', x:0, y:0, speed:295, gear:7, lap:42, gap:'+31.2s'  },
  { pos:8,  code:'ALO', team:'Aston Martin',    color:'#33bb88', x:0, y:0, speed:293, gear:6, lap:42, gap:'+38.4s'  },
  { pos:9,  code:'STR', team:'Aston Martin',    color:'#157050', x:0, y:0, speed:290, gear:7, lap:42, gap:'+44.9s'  },
  { pos:10, code:'GAS', team:'Alpine',          color:'#33b8f0', x:0, y:0, speed:288, gear:6, lap:41, gap:'+1 Lap'  },
  { pos:11, code:'COL', team:'Alpine',          color:'#0079b0', x:0, y:0, speed:285, gear:7, lap:41, gap:'+1 Lap'  },
  { pos:12, code:'ANT', team:'Mercedes',        color:'#1ab89d', x:0, y:0, speed:283, gear:6, lap:41, gap:'+1 Lap'  },
  { pos:13, code:'HAD', team:'Red Bull Racing', color:'#1f509a', x:0, y:0, speed:281, gear:7, lap:41, gap:'+1 Lap'  },
  { pos:14, code:'OCO', team:'Haas F1 Team',    color:'#eef0f1', x:0, y:0, speed:278, gear:6, lap:41, gap:'+1 Lap'  },
  { pos:15, code:'BEA', team:'Haas F1 Team',    color:'#b0b4b6', x:0, y:0, speed:276, gear:7, lap:41, gap:'+1 Lap'  },
  { pos:16, code:'LAW', team:'Racing Bulls',    color:'#88aaff', x:0, y:0, speed:274, gear:6, lap:41, gap:'+1 Lap'  },
  { pos:17, code:'LIN', team:'Racing Bulls',    color:'#4470e0', x:0, y:0, speed:272, gear:7, lap:40, gap:'+2 Laps' },
  { pos:18, code:'HUL', team:'Audi',            color:'#ff5533', x:0, y:0, speed:270, gear:6, lap:40, gap:'+2 Laps' },
  { pos:19, code:'BOR', team:'Audi',            color:'#cc2200', x:0, y:0, speed:268, gear:7, lap:40, gap:'+2 Laps' },
  { pos:20, code:'ALB', team:'Williams',        color:'#0f4faa', x:0, y:0, speed:266, gear:6, lap:40, gap:'+2 Laps' },
  { pos:21, code:'PER', team:'Cadillac',        color:'#c8c8cb', x:0, y:0, speed:264, gear:7, lap:40, gap:'+2 Laps' },
  { pos:22, code:'BOT', team:'Cadillac',        color:'#7a7a7d', x:0, y:0, speed:262, gear:6, lap:40, gap:'+2 Laps' },
]

// ─── RPM GAUGE ───────────────────────────────────────────────────────────────
function RpmGauge({ value, max = 380 }: { value: number; max?: number }) {
  const pct    = Math.min(value / max, 1)
  const cx     = 70, cy = 70, r = 54
  const toRad  = (d: number) => (d * Math.PI) / 180
  const start  = 220, sweep = 280
  const arcPt  = (angle: number) => ({ x: cx + r * Math.cos(toRad(angle - 90)), y: cy + r * Math.sin(toRad(angle - 90)) })
  const s      = arcPt(start)
  const e      = arcPt(start + sweep * pct)
  const bg_e   = arcPt(start + sweep)
  const large  = sweep * pct > 180 ? 1 : 0
  const stroke = pct > 0.8 ? '#D82B0D' : pct > 0.5 ? '#ff8c00' : '#fff'
  return (
    <svg width={140} height={120} viewBox="0 0 140 120">
      <path d={`M${s.x},${s.y} A${r},${r} 0 1 1 ${bg_e.x},${bg_e.y}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round"/>
      {pct > 0 && <path d={`M${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y}`} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round" style={{ filter: pct > 0.7 ? `drop-shadow(0 0 6px ${stroke})` : 'none' }}/>}
      {(() => { const tip = arcPt(start + sweep * pct); return <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#fff" strokeWidth="2" strokeLinecap="round"/> })()}
      <circle cx={cx} cy={cy} r="5" fill="#D82B0D"/>
      {Array.from({ length: 9 }).map((_, i) => { const a = start + (sweep / 8) * i; const o = { x: cx + (r-10)*Math.cos(toRad(a-90)), y: cy + (r-10)*Math.sin(toRad(a-90)) }; const ou = { x: cx + (r+2)*Math.cos(toRad(a-90)), y: cy + (r+2)*Math.sin(toRad(a-90)) }; return <line key={i} x1={o.x} y1={o.y} x2={ou.x} y2={ou.y} stroke="rgba(255,255,255,0.25)" strokeWidth={i%4===0?2:1}/> })}
      <text x={cx} y={cy+20} textAnchor="middle" style={{ fontFamily:"'Zen Dots',sans-serif", fontSize:13, fill: pct > 0.8 ? '#D82B0D' : '#fff' }}>{value > 0 ? value : '---'}</text>
      <text x={cx} y={cy+33} textAnchor="middle" style={{ fontFamily:"'Alumni Sans',sans-serif", fontSize:9, fill:'#9FA0C3' }}>km/h</text>
    </svg>
  )
}

// ─── RACE CANVAS ─────────────────────────────────────────────────────────────
function RaceCanvas({ trackMap, positions, width = 700, height = 340 }: { trackMap: TrackMap|null; positions: DriverPosition[]; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!trackMap || trackMap.x.length === 0) {
      ctx.strokeStyle = 'rgba(124,152,158,0.2)'; ctx.lineWidth = 28
      ctx.beginPath(); ctx.ellipse(canvas.width/2, canvas.height/2, canvas.width*0.35, canvas.height*0.32, 0, 0, Math.PI*2); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '13px "Alumni Sans"'; ctx.textAlign = 'center'
      ctx.fillText('Load session to render track', canvas.width/2, canvas.height/2+5); return
    }
    const PAD = 40; const scaleX = (canvas.width-PAD*2)/1000; const scaleY = (canvas.height-PAD*2)/1000
    const toX = (x: number) => PAD + x*scaleX; const toY = (y: number) => canvas.height - PAD - y*scaleY
    ctx.beginPath(); trackMap.x.forEach((x,i) => { i===0 ? ctx.moveTo(toX(x),toY(trackMap.y[i])) : ctx.lineTo(toX(x),toY(trackMap.y[i])) }); ctx.closePath()
    ctx.strokeStyle = 'rgba(80,80,80,0.8)'; ctx.lineWidth = 14; ctx.stroke()
    ctx.beginPath(); trackMap.x.forEach((x,i) => { i===0 ? ctx.moveTo(toX(x),toY(trackMap.y[i])) : ctx.lineTo(toX(x),toY(trackMap.y[i])) }); ctx.closePath()
    ctx.strokeStyle = 'rgba(216,43,13,0.5)'; ctx.lineWidth = 2; ctx.stroke()
    for (const d of positions) {
      const dx = toX(d.x), dy = toY(d.y), r = d.pos===1 ? 7 : 5
      if (d.pos===1) { ctx.shadowColor = d.color; ctx.shadowBlur = 12 } else ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI*2); ctx.fillStyle = d.color; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.shadowBlur = 0
    }
    ctx.font = '10px "Alumni Sans"'
    positions.slice(0,3).forEach(d => { ctx.fillStyle = '#fff'; ctx.fillText(d.code, toX(d.x)+8, toY(d.y)-4) })
  }, [trackMap, positions, width, height])
  return <canvas ref={canvasRef} width={width} height={height} className="block w-full h-full"/>
}

// ─── REPLAY CHROME (shared F1ReplayRoot) ─────────────────────────────────────
function SimulationChrome({ p }: { p: F1SessionFormRenderProps }) {
  return (
    <div className="flex flex-col gap-5">
      <div className={`${SIMULATION_SESSION_SURFACE} overflow-visible`}>
        <h2 className={`${H2} mb-4`}>Session Selection</h2>
        {p.isPredictiveSelection && (
          <div
            className="mb-4 rounded-lg border px-5 py-4 font-['Alumni_Sans'] text-[17px] leading-relaxed"
            style={{
              borderColor: 'rgba(167, 139, 250, 0.45)',
              background: 'rgba(99, 102, 241, 0.08)',
              color: '#ddd6fe',
            }}
          >
            <span className="font-semibold text-[18px] text-[#e9d5ff]">Predictive lap-time simulation.</span>{' '}
            This event is still in the future. Historical replay is not available. Lap times and race progression are driven
            by the TrackSense predictive lap-time model for this preview.
          </div>
        )}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(9.5rem,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <label className="block font-['Alumni_Sans'] text-[16px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Season
            </label>
            <DropdownDown value={p.year} onChange={p.setYear} options={YEARS.map((y) => ({ value: y, label: String(y) }))} className={SESSION_SELECT_CLS} />
          </div>
          <div className="min-w-0 sm:min-w-[9.5rem]">
            <label className="block font-['Alumni_Sans'] text-[16px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Round
            </label>
            <DropdownDown value={p.roundNum} onChange={p.setRoundNum} options={p.roundOptions} className={SESSION_SELECT_CLS} />
          </div>
          <div className="min-w-0">
            <label className="block font-['Alumni_Sans'] text-[16px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Session
            </label>
            <DropdownDown value={p.sessionType} onChange={p.setSessionType} options={SESSION_TYPE_OPTIONS} className={SESSION_SELECT_CLS} />
          </div>
        </div>
        {(p.scheduleLoading || p.selectedEventName || p.selectedEventDateDisplay) && (
          <div className="mb-4 rounded-lg border border-[rgba(124,152,158,0.2)] bg-[#0f1214] px-4 py-3">
            <div className="font-['Alumni_Sans'] text-[12px] uppercase tracking-[0.55em] text-[#748386]">Selected event</div>
            {p.scheduleLoading ? (
              <div className="mt-2 font-['Alumni_Sans'] text-[15px] text-[#9FA0C3]">Loading calendar…</div>
            ) : (
              <>
                {p.selectedEventName && (
                  <div className="mt-1 font-['Alumni_Sans'] text-[19px] font-semibold text-[#F0EBD8]">{p.selectedEventName}</div>
                )}
                {p.selectedEventDateDisplay && (
                  <div className="mt-0.5 font-['Alumni_Sans'] text-[16px] text-[#9FA0C3]">{p.selectedEventDateDisplay}</div>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex gap-3 items-center flex-wrap">
          <button
            type="button"
            onClick={() => void p.onLoadSession()}
            disabled={p.loading}
            className="border-none rounded-lg py-[10px] px-6 font-['Zen_Dots'] text-[13px] text-white transition-all duration-200"
            style={{
              background: p.loading ? 'rgba(216,43,13,0.35)' : '#D82B0D',
              cursor: p.loading ? 'not-allowed' : 'pointer',
            }}
          >
            {p.loading ? 'Loading telemetry…' : 'Load Session'}
          </button>
          {p.loadError && <p className="font-['Alumni_Sans'] text-sm text-[#ef4444]">⚠ {p.loadError}</p>}
        </div>
        {p.loading && (
          <p className="font-['Alumni_Sans'] text-[13px] text-[rgba(153,161,175,0.7)] mt-3">
            {p.year === 2026 && p.roundNum === 5 && p.sessionType === 'R'
              ? 'Opening predictive preview (model lap times; minimal data download).'
              : p.isPredictiveSelection
                ? 'This event is in the future — the backend may still download data or return an error if the session is not available yet.'
                : 'First load downloads from FastF1 — may take 30–120 seconds. Future loads use cache'}
          </p>
        )}
        <div className={BORDER} />
      </div>
    </div>
  )
}

// ─── PODIUM BLOCK ─────────────────────────────────────────────────────────────
function PodiumBlock({ pos, driver }: { pos: 1|2|3; driver: DriverPosition|undefined }) {
  const heights = { 1:'h-24', 2:'h-16', 3:'h-12' }
  const orders  = { 1:'order-2', 2:'order-1', 3:'order-3' }
  const medals  = { 1:'🥇', 2:'🥈', 3:'🥉' }
  return (
    <div className={`flex flex-col items-center ${orders[pos]}`}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 font-['Zen_Dots'] text-base text-white"
        style={{ background: driver ? `${driver.color}22` : 'rgba(255,255,255,0.05)', border:`2px solid ${driver ? driver.color : 'rgba(255,255,255,0.1)'}`, boxShadow: driver ? `0 0 16px ${driver.color}55` : 'none' }}>
        {driver ? driver.code : '---'}
      </div>
      <p className="font-['Alumni_Sans'] text-xs text-[#9FA0C3] mb-1 whitespace-nowrap">{driver ? driver.team.split(' ')[0] : '—'}</p>
      <div className="text-lg mb-1">{medals[pos]}</div>
      <div className={`w-20 ${heights[pos]} rounded-t-md flex items-center justify-center font-['Zen_Dots'] text-xl`}
        style={{ background: pos===1 ? 'linear-gradient(180deg,rgba(216,43,13,0.35) 0%,rgba(216,43,13,0.15) 100%)' : 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%)', border:`1px solid ${pos===1?'rgba(216,43,13,0.5)':'rgba(255,255,255,0.08)'}`, color: pos===1?'#D82B0D':'#fff' }}>
        {pos}
      </div>
    </div>
  )
}

function WhatIfTab({ p }: { p: F1SessionFormRenderProps }) {
  const [weather, setWeather] = useState<WhatIfWeather>('heavy_rain')
  const [strategy, setStrategy] = useState<WhatIfStrategy>('aggressive')
  const [tyre, setTyre] = useState<WhatIfTyre>('hard_one_stop')
  const [safetyCar, setSafetyCar] = useState<WhatIfSafetyCar>('single')
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<WhatIfOutcome | null>(null)
  const [scenarioAnimProgress, setScenarioAnimProgress] = useState(0)
  const [scenarioLbRunId, setScenarioLbRunId] = useState(0)

  const outcomeActualRows = useMemo((): LeaderboardFinishRow[] | null => {
    if (!outcome) return null
    return outcome.actualLeaderboard && outcome.actualLeaderboard.length > 0
      ? outcome.actualLeaderboard
      : outcome.actualPodium.map((r) => ({ code: r.code, pos: r.place, name: r.name }))
  }, [outcome])

  const scenarioAnimatedRows = useMemo((): LeaderboardFinishRow[] => {
    if (!outcome?.scenarioLeaderboard?.length || !outcomeActualRows) return outcome?.scenarioLeaderboard ?? []
    if (scenarioAnimProgress >= 1) return outcome.scenarioLeaderboard
    return interpolateScenarioLeaderboard(
      outcomeActualRows,
      outcome.scenarioLeaderboard,
      scenarioAnimProgress,
      outcome.scenarioLocked === true
    )
  }, [outcome, outcomeActualRows, scenarioAnimProgress])

  useEffect(() => {
    if (!outcome?.scenarioLeaderboard?.length) return
    let cancelled = false
    let raf = 0
    setScenarioAnimProgress(0)
    const t0 = performance.now()
    const totalMs = WHAT_IF_SCENARIO_HOLD_MS + WHAT_IF_SCENARIO_ANIM_MS
    const step = (now: number) => {
      if (cancelled) return
      const elapsed = now - t0
      let prog = 0
      if (elapsed >= WHAT_IF_SCENARIO_HOLD_MS) {
        prog = Math.min(1, (elapsed - WHAT_IF_SCENARIO_HOLD_MS) / WHAT_IF_SCENARIO_ANIM_MS)
      }
      setScenarioAnimProgress(prog)
      if (elapsed < totalMs) raf = requestAnimationFrame(step)
      else setScenarioAnimProgress(1)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [outcome])

  const gridReady =
    p.sessionLoaded &&
    !p.localPredictive &&
    !p.isPredictiveSelection &&
    (p.raceFinishLeaderboard?.length ?? 0) >= 3 &&
    !p.raceFinishLoading

  const resolveOutcome = async (w: WhatIfWeather, s: WhatIfStrategy, t: WhatIfTyre, sc: WhatIfSafetyCar) => {
    setRunning(true)
    setOutcome(null)
    setScenarioAnimProgress(0)
    const grid = p.raceFinishLeaderboard
    if (!grid || grid.length < 3) {
      await new Promise((r) => setTimeout(r, 200))
      setRunning(false)
      return
    }
    await new Promise((r) => setTimeout(r, WHAT_IF_LOAD_MS))
    const eventLabel = p.selectedEventName ?? `${p.year} · R${p.roundNum}`
    const next = computeScenarioFromFinishGrid(grid, eventLabel, p.year, w, s, t, sc, p.roundNum)
    setScenarioAnimProgress(0)
    setOutcome(next)
    setScenarioLbRunId((k) => k + 1)
    setRunning(false)
  }

  const runScenario = () => void resolveOutcome(weather, strategy, tyre, safetyCar)

  return (
    <div className="flex flex-col gap-5">
      <div className={`${PANEL}`}>
        {running && (
          <div className="mb-3 h-[2px] w-full rounded-full bg-[rgba(124,152,158,0.15)] overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-[#748386]/80 animate-pulse" />
          </div>
        )}

        <h3 className={`${H2} mb-2`}>What If Scenarios Controls</h3>
        <p className={`${META} text-[13px] mb-3`}>
          Uses the same race session you load above: classified order is read from the last telemetry frame, then a small rule-based model
          re-sorts the field for weather, tyre bias, SC density, and strategy. Win shares for the modeled top three are illustrative softmax
          weights, not calibrated odds.
        </p>
        {p.raceFinishLoading && (
          <p className={`${META} text-[13px] mb-3 text-[#a5b4fc]`}>
            <i className="fa-solid fa-circle-notch fa-spin mr-2" />
            Capturing classified order from the last frame…
          </p>
        )}
        {!p.raceFinishLoading && p.sessionLoaded && !p.localPredictive && !p.isPredictiveSelection && !p.raceFinishLeaderboard?.length && (
          <p className={`${META} text-[13px] mb-3 text-[#fde68a]`}>
            Finish order not available yet — try reloading the race session, or ensure the backend exposes driver positions on the final frame.
          </p>
        )}
        {!p.sessionLoaded && (
          <p className={`${META} text-[13px] mb-3 text-[#9FA0C3]`}>Load a historical race session above to enable comparisons.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block font-['Alumni_Sans'] text-[11px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Weather
            </label>
            <DropdownDown<WhatIfWeather>
              value={weather}
              onChange={setWeather}
              options={WHAT_IF_WEATHER_OPTIONS}
              className={SESSION_SELECT_CLS}
            />
          </div>
          <div>
            <label className="block font-['Alumni_Sans'] text-[11px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Race strategy
            </label>
            <DropdownDown<WhatIfStrategy>
              value={strategy}
              onChange={setStrategy}
              options={WHAT_IF_STRATEGY_OPTIONS}
              className={SESSION_SELECT_CLS}
            />
          </div>
          <div>
            <label className="block font-['Alumni_Sans'] text-[11px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Tyre / stint shape
            </label>
            <DropdownDown<WhatIfTyre>
              value={tyre}
              onChange={setTyre}
              options={WHAT_IF_TYRE_OPTIONS}
              className={SESSION_SELECT_CLS}
            />
          </div>
          <div>
            <label className="block font-['Alumni_Sans'] text-[11px] text-[#9FA0C3] tracking-[0.6px] uppercase mb-1.5">
              Safety car
            </label>
            <DropdownDown<WhatIfSafetyCar>
              value={safetyCar}
              onChange={setSafetyCar}
              options={WHAT_IF_SC_OPTIONS}
              className={SESSION_SELECT_CLS}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void runScenario()}
          disabled={running || !gridReady}
          className="font-['Zen_Dots'] text-[12px] text-white px-6 py-2.5 rounded-lg transition-all duration-200 border-none"
          style={{
            background: running || !gridReady ? 'rgba(216,43,13,0.35)' : '#D82B0D',
            cursor: running || !gridReady ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-circle-notch fa-spin" /> Updating comparison…
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-play mr-2" />
              Run comparison
            </span>
          )}
        </button>

        <div className="mt-7" style={{ overflowAnchor: 'none' }}>
        {running && gridReady && (p.raceFinishLeaderboard?.length ?? 0) >= 3 && !outcome && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border border-[rgba(124,152,158,0.18)] bg-[#1c2124] w-full">
              <div className="flex items-center justify-start gap-2 mb-2 text-left">
                <i className="fa-solid fa-flag-checkered text-[#9FA0C3] text-[15px]" />
                <span className="font-['Zen_Dots'] text-[14px] text-[#d1d5dc]">Classified Leaderboard</span>
              </div>
              <p className={`${META} text-[13px] mb-1.5 leading-relaxed text-[#c4c8d4]`}>
                Finish snapshot from the last telemetry frame — unchanged while the model runs.
              </p>
              <p className="font-['Alumni_Sans'] text-[12px] text-[#64748b] mb-3 leading-snug">
                PTS uses current F1 race points for positions 1–10 (0 beyond). NO. / TIME as captured from the session.
              </p>
              <ClassifiedLeaderboardTable rows={p.raceFinishLeaderboard as LeaderboardFinishRow[]} variant="actual" />
            </div>
            <div className="rounded-xl p-5 border border-[rgba(124,152,158,0.18)] bg-[#1c2124] w-full">
              <div className="flex items-center justify-start gap-2 mb-2 text-left">
                <i className="fa-solid fa-shuffle text-[#9FA0C3] text-[15px]" />
                <span className="font-['Zen_Dots'] text-[14px] text-[#d1d5dc]">Scenario Leaderboard</span>
              </div>
              <p className={`${META} text-[13px] mb-1.5 leading-relaxed text-[#c4c8d4]`}>
                Loading — then this table will start matching the left column and animate into the modeled order.
              </p>
              <p className="font-['Alumni_Sans'] text-[12px] text-[#64748b] mb-3 leading-snug">
                Typical wait ~{Math.round(WHAT_IF_LOAD_MS / 1000)}s, then the grid matches actual for{' '}
                {Math.round(WHAT_IF_SCENARIO_HOLD_MS / 1000)}s before row swap animation into the scenario order (~
                {Math.round(WHAT_IF_SCENARIO_ANIM_MS / 1000)}s).
              </p>
              <ScenarioLeaderboardSkeleton rowCount={p.raceFinishLeaderboard?.length ?? 12} />
            </div>
          </div>
        )}

        {outcome && outcomeActualRows && (() => {
          const actualRows = outcomeActualRows
          const actualPositionByCode = Object.fromEntries(actualRows.map((r) => [r.code, r.pos])) as Record<string, number>
          return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl p-5 border border-[rgba(124,152,158,0.18)] bg-[#1c2124] w-full">
                <div className="flex items-center justify-start gap-2 mb-2 text-left">
                  <i className="fa-solid fa-flag-checkered text-[#9FA0C3] text-[15px]" />
                  <span className="font-['Zen_Dots'] text-[14px] text-[#d1d5dc]">Classified Leaderboard</span>
                </div>
                {!outcome.scenarioLocked && (
                  <p className={`${META} text-[11px] text-[#64748b] mb-2`}>
                    Last frame snapshot — TIME / LAPS from telemetry.
                  </p>
                )}
                <ClassifiedLeaderboardTable rows={actualRows} variant="actual" />
              </div>

              <div className="rounded-xl p-5 border border-[rgba(124,152,158,0.18)] bg-[#1c2124] w-full">
                <div className="flex items-center justify-start gap-2 mb-2 text-left">
                  <i className="fa-solid fa-shuffle text-[#9FA0C3] text-[15px]" />
                  <span className="font-['Zen_Dots'] text-[14px] text-[#d1d5dc]">Scenario Leaderboard</span>
                </div>
                {!outcome.scenarioLocked && (
                  <p className={`${META} text-[11px] text-[#93c5fd] mb-2`}>
                    Modeled finish — TIME is a synthetic race clock (not the left-column telemetry). LAPS show modeled
                    race distance where applied.
                  </p>
                )}
                <ClassifiedLeaderboardTable
                  key={`scenario-lb-${scenarioLbRunId}`}
                  rows={scenarioAnimatedRows}
                  variant="scenario"
                  actualPositionByCode={actualPositionByCode}
                  flipRowAnimation
                  actualLeaderboardForTimeCompare={actualRows}
                />
              </div>
            </div>

            {outcome.predictedWinPct && outcome.predictedWinPct.length > 0 && (
              <div>
                <p className="font-['Alumni_Sans'] text-[11px] uppercase tracking-wide text-[#9FA0C3] mb-2">
                  Modeled top three — win share (scenario conditions)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {outcome.predictedWinPct.map((x, i) => (
                    <div
                      key={x.code}
                      className="rounded-xl border border-[rgba(124,152,158,0.2)] bg-[#161a1d] px-4 py-3 text-center"
                    >
                      <div className="font-['Alumni_Sans'] text-[10px] uppercase text-[#748386] mb-1">Model P{i + 1}</div>
                      <div className="font-['Zen_Dots'] text-[16px] text-white mb-1">{x.code}</div>
                      <div className="font-['Alumni_Sans'] text-[12px] text-[#cbd5e1] truncate mb-2">{x.name}</div>
                      <div className="font-['Zen_Dots'] text-[22px] text-[#a5b4fc]">{x.winPct}%</div>
                      <div className="font-['Alumni_Sans'] text-[10px] text-[#64748b] mt-1">Softmax share vs top 10</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="font-['Alumni_Sans'] text-[14px] text-[#c4c8d4] leading-relaxed border-l-2 border-[rgba(124,152,158,0.35)] pl-3">
              <span className="text-[#d1d5dc]">{outcome.blurb}</span> {outcome.paceNote}
            </p>

            <div className="rounded-xl p-5 border border-[rgba(124,152,158,0.18)] bg-[#1c2124] w-full">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-chart-simple text-[#9FA0C3]" />
                <span className="font-['Zen_Dots'] text-[12px] text-[#d1d5dc]">Scenario podium — normalized weights</span>
              </div>
              <p className={`${META} text-[11px] mb-3`}>Podium probabilities for the modeled P1–P3 order (sum 100%).</p>
              <ul className="space-y-2">
                {outcome.predictedPodium.map((row, i) => (
                  <li
                    key={`${row.code}-${i}-det`}
                    className="flex items-baseline justify-between gap-2 font-['Alumni_Sans'] text-[#e5e7eb]"
                  >
                    <span className="text-[#9FA0C3] w-8 shrink-0">P{i + 1}</span>
                    <span className="flex-1 min-w-0 text-[16px]">
                      <span className="text-[#fb923c] font-semibold mr-2">{row.code}</span>
                      {row.name}
                    </span>
                    <span className="shrink-0 text-[#a5b4fc] font-['Zen_Dots'] text-[13px]">{row.probability}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          )
        })()}
        </div>

        <div className={BORDER} />
        <p className={`${META} text-[11px] mt-4`}>
          Win-share bars use a softmax over the front of the field; podium % rows renormalize to 100% for the modeled P1–P3 only.
        </p>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Simulation() {
  const [activeTab, setActiveTab] = useState<'simulation' | 'whatif'>('simulation')
  const whatIfSessionPresetRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (activeTab !== 'whatif') return
    whatIfSessionPresetRef.current?.()
  }, [activeTab])

  return (
    <div className={PAGE}>

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      <div className={INNER}>

        {/* Header */}
        <div className="relative text-right rounded-xl py-6 px-6 overflow-hidden border border-[rgba(124,152,158,0.1)]"
          style={{ background: 'linear-gradient(105deg,rgba(216,43,13,0.04) 0%,transparent 60%)' }}>
          <div className="absolute inset-0 diag-stripes opacity-50 rounded-xl" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D] rounded-l-xl" />
          <div className="relative">
            <h1 className={H1}>Race Simulation</h1>
            <p className="font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]">
              Real-time replay · Session-linked what-if · Predictive demo race
            </p>
          </div>
        </div>

        <SectionDivider variant="sector" label="Race Engine" />

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          {[
            { id:'simulation', icon:'fa-solid fa-play', label:'Race Simulation' },
            { id:'whatif',     icon:'fa-solid fa-dice', label:'What If Scenarios' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'simulation' | 'whatif')}
              className="flex items-center gap-2 py-2 px-5 rounded-lg font-['Alumni_Sans'] text-[14px] font-semibold transition-all duration-150 border-none"
              style={{
                background: activeTab === tab.id ? '#D82B0D' : 'rgba(124,152,158,0.08)',
                color:       activeTab === tab.id ? '#F0EBD8' : 'rgba(159,160,195,0.6)',
              }}
            >
              <i className={tab.icon} style={{ fontSize:13 }}/>
              {tab.label}
            </button>
          ))}
          <div className="ml-auto font-['Alumni_Sans'] text-[12px] text-[#748386] flex items-center gap-2">
            <i className="fa-solid fa-circle-nodes" style={{ color:'#9FA0C3' }}/>
            Powered by FastF1 + Simulation Engine
          </div>
        </div>

        <SectionDivider variant="sector" label="Telemetry" />

        <F1ReplayRoot
          showReplay={activeTab === 'simulation'}
          renderSessionForm={(rp) => {
            whatIfSessionPresetRef.current = () => {
              rp.setYear(WHAT_IF_TAB_SESSION_YEAR)
              rp.setRoundNum(WHAT_IF_TAB_SESSION_ROUND)
            }
            return (
              <div className="flex flex-col gap-5">
                <SimulationChrome p={rp} />
                {activeTab === 'whatif' && <WhatIfTab p={rp} />}
              </div>
            )
          }}
        />

      </div>
    </div>
  )
}

