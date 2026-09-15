import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { DriverTelemetry, SessionInfo, TelemetryFrame } from '../types/telemetry'
import TyreIcon from './TyreIcon'
import { REPLAY_CHROME, REPLAY_INNER_TILE } from './layout'

/** Stat tiles on red/purple expanded row — deeper neutral + inset edge so they read clearly on tinted wash */
const SESSION_DETAIL_TILE_ON_TINT =
  'flex min-h-0 flex-col justify-center gap-0.5 rounded-lg border border-[rgba(124,152,158,0.24)] bg-[#0a0c0e] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

const TEAM_LOGO_SLUG: Record<string, string> = {
  'oracle red bull racing':     'redbull',
  'red bull racing':            'redbull',
  'mercedes':                   'mercedes',
  'ferrari':                    'ferrari',
  'mclaren':                    'mclaren',
  'aston martin':               'astonmartin',
  'alpine':                     'alpine',
  'williams':                   'williams',
  'haas f1 team':               'haas',
  'moneygram haas f1 team':     'haas',
  'rb':                         'racingbulls',   
  'visa cash app rb':           'racingbulls',
  'racing bulls':               'racingbulls',
  'sauber':                     'audi',          
  'stake f1 team kick sauber':  'audi',          
  'kick sauber':                'audi',          
  'audi':                       'audi',
  'cadillac':                   'cadillac',
}

const TEAM_COLOR_BG: Record<string, string> = {
  'oracle red bull racing':     '#0038c2',
  'red bull racing':            '#142948',
  'mercedes':                   '#067e6a',
  'ferrari':                    '#DC0000',
  'mclaren':                    '#804000',
  'aston martin':               '#0f4331',
  'alpine':                     '#004e70',
  'williams':                   '#082145',
  'haas f1 team':               '#667175',
  'moneygram haas f1 team':     '#B6BABD',
  'rb':                         '#6692FF',
  'visa cash app rb':           '#6692FF',
  'racing bulls':               '#6692FF',
  'sauber':                     '#BB0A21',
  'stake f1 team kick sauber':  '#BB0A21',
  'kick sauber':                '#BB0A21',
  'audi':                       '#BB0A21',
  'cadillac':                   '#58585b',
}

function teamLogoSlug(team: string): string | null {
  const k = team.trim().toLowerCase()
  return TEAM_LOGO_SLUG[k] ?? null
}

function teamColorBg(team: string): string {
  return TEAM_COLOR_BG[team.trim().toLowerCase()] ?? '#1c1c1e'
}

interface LeaderboardProps {
  frameData: TelemetryFrame | null
  sessionInfo?: SessionInfo | null
  initialGridMode?: boolean
}

function formatLapTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

/** Per-frame FL from wall-clock lap deltas can be garbage (e.g. telemetry join mid-lap). */
const FASTEST_LAP_PLAUSIBLE_MIN_S = 45
const FASTEST_LAP_PLAUSIBLE_MAX_S = 240

function isPlausibleFastestLap(fl: { time_seconds?: number } | null | undefined): boolean {
  const t = fl?.time_seconds
  return typeof t === 'number' && Number.isFinite(t) && t >= FASTEST_LAP_PLAUSIBLE_MIN_S && t <= FASTEST_LAP_PLAUSIBLE_MAX_S
}

function pickDisplayFastestLap(
  frameFl: SessionInfo['fastest_lap'],
  sessionFl: SessionInfo['fastest_lap']
): SessionInfo['fastest_lap'] {
  if (isPlausibleFastestLap(frameFl ?? undefined)) return frameFl
  if (isPlausibleFastestLap(sessionFl ?? undefined)) return sessionFl
  return null
}

function sortDrivers(frame: TelemetryFrame): [string, DriverTelemetry][] {
  return Object.entries(frame.drivers).sort((a, b) => {
    const posA = a[1].position ?? Number.MAX_SAFE_INTEGER
    const posB = b[1].position ?? Number.MAX_SAFE_INTEGER
    if (posA !== posB) return posA - posB
    return a[0].localeCompare(b[0])
  })
}

const demoGapMps = 52

function intervalLabel(
  sorted: [string, DriverTelemetry][],
  index: number,
  predictiveGapModel: boolean
): string {
  if (index === 0) return 'LEADER'
  const ahead = sorted[index - 1][1]
  const me = sorted[index][1]
  const lapA = ahead.lap ?? 0
  const lapM = me.lap ?? 0
  if (lapA !== lapM) {
    const d = lapA - lapM
    if (d >= 1) return d === 1 ? '+1 LAP' : `+${d} LAPS`
    return '—'
  }

  // Use backend gap first
  const da = ahead.dist ?? 0
  const dm = me.dist ?? 0
  let gapM =
    ahead.gap_to_leader_m != null && me.gap_to_leader_m != null
      ? Math.max(0, me.gap_to_leader_m - ahead.gap_to_leader_m)
      : Math.abs(da - dm)
  
  // Duplicate gap and use distance
  if (gapM < 0.5) {
    gapM = Math.abs(da - dm)
  }
  
  const sec =
    predictiveGapModel &&
    ahead.gap_to_leader_m != null &&
    me.gap_to_leader_m != null
      ? gapM / demoGapMps
      : gapM / Math.max((me.speed ?? 0) / 3.6, 25)
  if (sec > 0 && sec < 0.0005) return '+0.0001s'
  if (sec < 600) return `+${sec.toFixed(4)}s`
  return `+${(sec / 60).toFixed(1)}m`
}

function teamInitials(team: string): string {
  const w = team
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase()
  if (w.length === 1 && w[0].length >= 2) return w[0].slice(0, 2).toUpperCase()
  return team.slice(0, 2).toUpperCase() || '—'
}

function textOnHexBackground(hex: string): string {
  const m = hex.replace('#', '')
  if (m.length < 6) return '#f8fafc'
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#f8fafc'
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  return y > 165 ? '#0f172a' : '#f8fafc'
}

function TeamMark({ team, color }: { team: string; color: string }) {
  const slug = teamLogoSlug(team)
  const bg   = teamColorBg(team)
  const [imgFailed, setImgFailed] = useState(false)
  const fg = textOnHexBackground(bg)

  if (slug && !imgFailed) {
    return (
      <img
        src={`/team-logos/${slug}.webp`}
        alt=""
        title={team}
        className="h-7 w-7 shrink-0  object-contain"
        onError={() => setImgFailed(true)}
      />
    )
  }

  // Fallback initials — unchanged
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[9px] font-black leading-none shadow-inner ring-1 ring-[rgba(124,152,158,0.15)]"
      style={{ backgroundColor: color, color: fg }}
      title={team}
    >
      {teamInitials(team)}
    </div>
  )
}

function getGearColor(gear: number) {
  if (gear === 0) return 'text-red-400'
  if (gear >= 7) return 'text-green-400'
  return 'text-yellow-400'
}

/** Live race clock with milliseconds so high-FPS / predictive playback does not sit on one whole second. */
function formatTime(seconds: number): string {
  const ms = Math.max(0, Math.round(Number(seconds) * 1000))
  const m = Math.floor(ms / 60000)
  const rem = ms % 60000
  const sInt = Math.floor(rem / 1000)
  const sFrac = rem % 1000
  return `${String(m).padStart(2, '0')}:${String(sInt).padStart(2, '0')}.${String(sFrac).padStart(3, '0')}`
}

function formatRaceResultTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

function DriverTelemetryTiles({ data, tileClassName }: { data: DriverTelemetry; tileClassName: string }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1 text-[10px] sm:grid-cols-3 sm:gap-1">
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Speed</span>
          <span className="font-mono text-[14px] text-white">{Math.round(data.speed)} km/h</span>
        </div>
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Gear</span>
          <span className={`font-mono text-[14px] font-bold ${getGearColor(data.gear)}`}>
            {data.gear === 0 ? 'N' : data.gear}
          </span>
        </div>
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Throttle</span>
          <span className="font-mono text-[14px] text-green-400">{Math.round(data.throttle)}%</span>
        </div>
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Brake</span>
          <span className="font-mono text-[14px] text-red-400">{Math.round(data.brake * 100.0)}%</span>
        </div>
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">DRS</span>
          <span className="font-mono text-[14px]">
            {data.drs > 0 ? (
              <span className="text-purple-400">Open</span>
            ) : (
              <span className="text-[#748386]">Closed</span>
            )}
          </span>
        </div>
        <div className={tileClassName}>
          <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Tyre</span>
          <div className="flex items-center gap-1.5">
            <TyreIcon compound={data.compound} tyre={data.tyre} size="sm" />
            <span className="min-w-0 flex-1 break-words font-mono text-[14px] text-white">
              {data.compound || '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#0d0f10] ring-1 ring-[rgba(0,0,0,0.35)]">
        <div className="bg-green-500 transition-[width]" style={{ width: `${data.throttle}%` }} />
        <div className="bg-red-500 transition-[width]" style={{ width: `${data.brake}%` }} />
      </div>
    </>
  )
}

function driverTelemetryTilesEqual(
  prev: { data: DriverTelemetry; tileClassName: string },
  next: { data: DriverTelemetry; tileClassName: string }
): boolean {
  if (prev.tileClassName !== next.tileClassName) return false
  const a = prev.data
  const b = next.data
  if (a === b) return true
  return (
    a.speed === b.speed &&
    a.gear === b.gear &&
    a.throttle === b.throttle &&
    a.brake === b.brake &&
    a.drs === b.drs &&
    a.compound === b.compound &&
    a.tyre === b.tyre
  )
}

const DriverTelemetryTilesMemo = memo(DriverTelemetryTiles, driverTelemetryTilesEqual)

type LeaderboardRowProps = {
  code: string
  data: DriverTelemetry
  expanded: boolean
  interval: string
  isLeader: boolean
  abbrev: string
  hasFastestLap: boolean
  /** Shown only inside expanded session detail (first line), not on the collapsed row. */
  fastestLapSessionLine: string | null
  onToggle: (code: string) => void
}

function leaderboardRowPropsEqual(prev: LeaderboardRowProps, next: LeaderboardRowProps): boolean {
  if (prev.code !== next.code) return false
  if (prev.expanded !== next.expanded) return false
  if (prev.interval !== next.interval) return false
  if (prev.isLeader !== next.isLeader) return false
  if (prev.abbrev !== next.abbrev) return false
  if (prev.hasFastestLap !== next.hasFastestLap) return false
  if (prev.fastestLapSessionLine !== next.fastestLapSessionLine) return false
  if (prev.onToggle !== next.onToggle) return false
  const a = prev.data
  const b = next.data
  if (a === b) return true
  return (
    a.position === b.position &&
    a.lap === b.lap &&
    a.speed === b.speed &&
    a.gear === b.gear &&
    a.throttle === b.throttle &&
    a.brake === b.brake &&
    a.drs === b.drs &&
    a.dist === b.dist &&
    a.team === b.team &&
    a.color === b.color &&
    a.abbrev === b.abbrev &&
    a.compound === b.compound &&
    a.tyre === b.tyre &&
    a.finished === b.finished &&
    a.out === b.out &&
    a.pitting === b.pitting &&
    a.pit_stops === b.pit_stops
  )
}

const LeaderboardRow = memo(
  forwardRef<HTMLDivElement, LeaderboardRowProps>(function LeaderboardRow(
    {
      code,
      data,
      expanded,
      interval,
      isLeader,
      abbrev,
      hasFastestLap,
      fastestLapSessionLine,
      onToggle,
    },
    ref
  ) {
    const toggle = () => onToggle(code)
    const sessionTileClass = expanded ? SESSION_DETAIL_TILE_ON_TINT : REPLAY_INNER_TILE
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${abbrev}, position ${data.position ?? '?'}. Press to ${expanded ? 'collapse' : 'expand'} session detail.`}
        className={`cursor-pointer rounded-lg text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#D82B0D]/45 ${
          expanded && hasFastestLap
            ? 'border border-purple-500/50 bg-purple-950/20 ring-1 ring-purple-500/30'
            : expanded
              ? 'border border-[rgba(216,43,13,0.55)] bg-red-950/20 ring-1 ring-[rgba(216,43,13,0.35)]'
              : hasFastestLap
                ? 'border border-purple-500/40 bg-purple-950/15 hover:border-purple-500/55'
                : ''
              }`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
      >
        <div className="flex min-h-0 flex-wrap items-center gap-x-8 gap-y-0.5 px-1.5 py-1">
          <span className="w-10 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-[#E8E8EF]">
            {data.position ?? '—'}
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-10">
            <TeamMark team={data.team ?? 'Team'} color={data.color} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: data.color }}
          >
            {abbrev}
          </span>
                {data.finished ? (
                  <span className="rounded bg-emerald-950/80 px-1 py-px text-[8px] font-semibold uppercase text-emerald-300 ring-1 ring-emerald-700/50">
                    FINISH
                  </span>
                ) : data.out ? (
                  <span className="rounded bg-zinc-800/90 px-1 py-px text-[8px] font-semibold uppercase text-zinc-300 ring-1 ring-zinc-600/60">
                    OUT
                  </span>
                ) : data.pitting ? (
                  <span className="rounded bg-red-950/80 px-1 py-px text-[8px] font-semibold uppercase text-red-300">
                    Pit
                  </span>
                ) : null}
              </div>
              {data.team ? (
                <p className="truncate font-['Alumni_Sans'] text-[15px] leading-tight text-[#748386]">{data.team}</p>
              ) : null}
            </div>
          </div>

          <div
            className={`ml-auto min-w-[2.85rem] shrink-0 text-right font-mono text-[10px] font-semibold tabular-nums leading-tight ${
              isLeader ? 'text-[#E8B84B]' : 'text-[#E8E8EF]'
            }`}
          >
            {interval === 'LEADER' ? 'LEADER' : interval}
          </div>

          <TyreIcon compound={data.compound} tyre={data.tyre} size="sm" />

          <span
            className={`inline-block shrink-0 text-[9px] text-[#9FA0C3] transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden
          >
            ▾
          </span>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0" aria-hidden={!expanded}>
            <div
              className={`border-t border-[rgba(124,152,158,0.18)] px-3 pb-3 pt-3 transition-opacity duration-200 ease-out motion-reduce:transition-none sm:px-4 sm:pb-4 ${
                expanded ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="flex flex-col gap-1">
                {hasFastestLap && fastestLapSessionLine ? (
                  <p
                    className="w-full text-center font-mono text-[15px] font-semibold tabular-nums leading-snug text-white sm:text-[16px]"
                    title={fastestLapSessionLine}
                  >
                    {fastestLapSessionLine}
                  </p>
                ) : null}
                <p className="font-['Alumni_Sans'] text-[13px] font-semibold uppercase tracking-wide text-[#748386]">
                  Session detail
                </p>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1">
                  <div className={sessionTileClass}>
                    <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Lap</span>
                    <span className="font-mono text-[14px] text-white">{data.lap ?? '—'}</span>
                  </div>
                  <div className={sessionTileClass}>
                    <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Pit stops so far</span>
                    <span className="font-mono text-[14px] text-white">{data.pit_stops ?? 0}</span>
                  </div>
                  <div className={`${sessionTileClass} sm:col-span-1`}>
                    <span className="block text-[11px] uppercase tracking-wide text-[#748386]">Race distance</span>
                    <span className="font-mono text-[14px] text-white">
                      {data.dist != null ? `${(data.dist / 1000).toFixed(3)} km` : '—'}
                    </span>
                  </div>
                </div>
                <DriverTelemetryTilesMemo data={data} tileClassName={sessionTileClass} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
  leaderboardRowPropsEqual
)

export default function Leaderboard({ frameData, sessionInfo, initialGridMode = false }: LeaderboardProps) {
  const ANIM_MS = 1000
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const handleToggleRow = useCallback((code: string) => {
    setExpandedCode((c) => (c === code ? null : code))
  }, [])
  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const prevTopByCodeRef = useRef<Map<string, number>>(new Map())
  const animCleanupRef = useRef<number | null>(null)
  const queuedRowsRef = useRef<[string, DriverTelemetry][] | null>(null)
  const queuedOrderSigRef = useRef<string>('')
  const isAnimatingRef = useRef(false)
  const lastFrameStampRef = useRef<number | null>(null)
  const rows = useMemo(() => {
    if (!frameData) return []
    const byPos = sortDrivers(frameData)
    if (!initialGridMode) return byPos

    // Force a true race-start presentation from grid slots when available,
    // even if incoming frame positions are already at race-end order.
    const byGrid = [...byPos].sort((a, b) => {
      const ga = typeof a[1].grid_position === 'number' ? a[1].grid_position : Number.MAX_SAFE_INTEGER
      const gb = typeof b[1].grid_position === 'number' ? b[1].grid_position : Number.MAX_SAFE_INTEGER
      if (ga !== gb) return ga - gb
      return a[0].localeCompare(b[0])
    })
    return byGrid.map(([code, data], i) => [
      code,
      {
        ...data,
        position: i + 1,
        lap: 1,
        finished: false,
        out: false,
        pitting: false,
      },
    ] as [string, DriverTelemetry])
  }, [frameData, initialGridMode])
  const [displayRows, setDisplayRows] = useState<[string, DriverTelemetry][]>(rows)
  const incomingOrderSig = useMemo(() => rows.map(([code, data]) => `${code}:${data.position ?? ''}`).join('|'), [rows])
  const displayOrderSig = useMemo(
    () => displayRows.map(([code, data]) => `${code}:${data.position ?? ''}`).join('|'),
    [displayRows]
  )

  const rowsToRender = useMemo(() => {
    if (!rows.length) return displayRows
    if (!displayRows.length) return rows
    if (incomingOrderSig === displayOrderSig) return rows
    return displayRows
  }, [rows, displayRows, incomingOrderSig, displayOrderSig])

  const leaderLap = Math.max(1, rowsToRender[0]?.[1]?.lap ?? 1)
  const totalLapsFromSession = sessionInfo?.total_laps ?? null
  const inferredTotalLaps = rowsToRender.reduce((mx, [, d]) => Math.max(mx, d.lap ?? 0), 0)
  const totalLaps = totalLapsFromSession && totalLapsFromSession > 0
    ? totalLapsFromSession
    : Math.max(leaderLap, inferredTotalLaps)
  const showFastestLapUi = !initialGridMode && leaderLap >= 2 // Fastest lap from lap two
  const fl = !initialGridMode
    ? pickDisplayFastestLap(frameData?.fastest_lap ?? null, sessionInfo?.fastest_lap ?? null)
    : null

  const predictiveGapModel = Boolean(frameData?.predictive_gap_model)
  const intervalByCode = useMemo(() => {
    const m = new Map<string, string>()
    rowsToRender.forEach(([code], index) => {
      m.set(code, intervalLabel(rowsToRender, index, predictiveGapModel))
    })
    return m
  }, [rowsToRender, predictiveGapModel])

  const leaderData = rowsToRender[0]?.[1]
  const leaderFinished = Boolean(leaderData?.finished)
  const leaderFinishTime =
    leaderFinished && typeof leaderData?.finish_time_seconds === 'number'
      ? leaderData.finish_time_seconds
      : null

  const resultGapByCode = useMemo(() => {
    const m = new Map<string, string>()
    if (leaderFinishTime == null) return m
    rowsToRender.forEach(([code, data], index) => {
      if (index === 0) {
        m.set(code, formatRaceResultTime(leaderFinishTime))
        return
      }

      if (typeof data.finish_time_seconds === 'number') {
        const delta = Math.max(0, data.finish_time_seconds - leaderFinishTime)
        m.set(code, `+${delta.toFixed(3)}s`)
      } else if (data.out) {
        m.set(code, '-')
      } else {
        m.set(code, intervalByCode.get(code) ?? '—')
      }
    })
    return m
  }, [rowsToRender, leaderFinishTime, intervalByCode])

  useEffect(() => {
    if (!frameData) {
      prevTopByCodeRef.current = new Map()
      queuedRowsRef.current = null
      queuedOrderSigRef.current = ''
      isAnimatingRef.current = false
      lastFrameStampRef.current = null
      setDisplayRows([])
      if (animCleanupRef.current != null) {
        window.clearTimeout(animCleanupRef.current)
        animCleanupRef.current = null
      }

      return
    }

    const frameStamp = frameData.time ?? frameData.t ?? null

    // Start-grid projection: keep display rows in lockstep without waiting for clock ticks.
    if (initialGridMode) {
      if (!displayRows.length || incomingOrderSig !== displayOrderSig) {
        setDisplayRows(rows)
      }
      if (frameStamp != null) lastFrameStampRef.current = frameStamp
      return
    }

    const frameDidAdvance = frameStamp != null && frameStamp !== lastFrameStampRef.current
    if (frameStamp != null) lastFrameStampRef.current = frameStamp

    // Order can change without a new frame stamp (e.g. leaving start-grid mode on Play).
    if (!frameDidAdvance) {
      queuedRowsRef.current = null
      queuedOrderSigRef.current = ''
      if (
        displayRows.length &&
        incomingOrderSig !== displayOrderSig &&
        !isAnimatingRef.current
      ) {
        setDisplayRows(rows)
        prevTopByCodeRef.current = new Map()
        if (animCleanupRef.current != null) {
          window.clearTimeout(animCleanupRef.current)
          animCleanupRef.current = null
        }
      }
      return
    }

    if (!displayRows.length) {
      setDisplayRows(rows)
      return
    }

    if (incomingOrderSig === displayOrderSig) {
      return
    }

    if (isAnimatingRef.current) {
      queuedRowsRef.current = rows
      queuedOrderSigRef.current = incomingOrderSig
      return
    }

    setDisplayRows(rows)
  }, [
    frameData,
    rows,
    initialGridMode,
    incomingOrderSig,
    displayOrderSig,
    displayRows.length,
  ])

  useLayoutEffect(() => {
    if (!rowsToRender.length) return
    if (animCleanupRef.current != null) {
      window.clearTimeout(animCleanupRef.current)
      animCleanupRef.current = null
    }

    rowsToRender.forEach(([code]) => {
      const el = rowRefs.current.get(code)
      if (!el) return
      el.style.transition = ''
      el.style.transform = ''
    })

    const prevTop = prevTopByCodeRef.current
    const nextTop = new Map<string, number>()
    const moving: Array<{ el: HTMLDivElement; dy: number }> = []
    rowsToRender.forEach(([code]) => {
      const el = rowRefs.current.get(code)
      if (!el) return
      const top = el.getBoundingClientRect().top
      nextTop.set(code, top)
      const before = prevTop.get(code)
      if (before == null) return
      const dy = before - top
      if (Math.abs(dy) < 0.5) return
      moving.push({ el, dy })
    })

    if (moving.length) {
      isAnimatingRef.current = true
      moving.forEach(({ el, dy }) => {
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
      })

      void document.body.offsetHeight
      moving.forEach(({ el }) => {
        el.style.transition = `transform ${ANIM_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        el.style.transform = 'translateY(0)'
      })

      animCleanupRef.current = window.setTimeout(() => {
        rowsToRender.forEach(([code]) => {
          const el = rowRefs.current.get(code)
          if (!el) return
          el.style.transition = ''
          el.style.transform = ''
        })

        isAnimatingRef.current = false
        const next = queuedRowsRef.current
        const nextSig = queuedOrderSigRef.current
        queuedRowsRef.current = null
        queuedOrderSigRef.current = ''
        if (next && nextSig && nextSig !== displayOrderSig) setDisplayRows(next)
        animCleanupRef.current = null
      }, ANIM_MS + 60)
    }

    prevTopByCodeRef.current = nextTop
  }, [displayOrderSig])

  useEffect(() => {
    return () => {
      if (animCleanupRef.current != null) {
        window.clearTimeout(animCleanupRef.current)
        animCleanupRef.current = null
      }
    }
  }, [])

  if (!frameData) {
    return (
      <div className={`${REPLAY_CHROME} w-full min-w-0 p-3`}>
      <div className="mb-1.5 pb-1.5 flex items-center justify-between border-b border-[rgba(124,152,158,0.12)]">
        <h2 className="font-['Zen_Dots'] text-sm font-normal tracking-tight text-[#D82B0D]">
          Leaderboard
        </h2>
      </div>
        <p className="font-['Alumni_Sans'] text-xs text-[#9FA0C3]">No data available</p>
      </div>
    )
  }

  return (
    <div className={`${REPLAY_CHROME} h-full w-full min-w-0 p-2.5 sm:p-3`}>
      <h2 className="mb-1.5 pb-1.5 font-['Zen_Dots'] text-sm font-normal tracking-tight text-[#D82B0D]">
        Leaderboard
      </h2>
      {rowsToRender.length > 0 && (
          <div className="flex items-baseline gap-1">
            <span className="font-['Alumni_Sans'] text-[10px] uppercase tracking-[0.08em] text-[#748386]">
              Lap
            </span>
            <span className="font-['Zen_Dots'] text-[13px] text-[#E8E8EF]">
              {leaderLap}/{totalLaps}
            </span>
          </div>
        )}

      <div className="flex flex-col gap-0.5 overflow-visible text-[12px]">
        {rowsToRender.map(([code, data]) => {
          const rowData: DriverTelemetry = initialGridMode
            ? { ...data, lap: 1, finished: false, out: false, pitting: false }
            : data
          const expanded = expandedCode === code
          const interval = initialGridMode
            ? '+0.0000s'
            :
            leaderFinishTime != null
              ? (resultGapByCode.get(code) ?? intervalByCode.get(code) ?? '—')
              : (intervalByCode.get(code) ?? '—')

          const isLeader = rowData.position === 1
          const abbrev = rowData.abbrev ?? code
          const hasFastestLap = Boolean(showFastestLapUi && fl?.abbrev && abbrev === fl.abbrev)
          const fastestLapSessionLine =
            hasFastestLap && fl && typeof fl.time_seconds === 'number'
              ? fl.lap
                ? `Fastest lap · ${formatLapTime(fl.time_seconds)} · Lap ${fl.lap}`
                : `Fastest lap · ${formatLapTime(fl.time_seconds)}`
              : null

          return (
            <LeaderboardRow
              key={code}
              ref={(el) => {
                rowRefs.current.set(code, el)
              }}
              code={code}
              data={rowData}
              expanded={expanded}
              interval={interval}
              isLeader={isLeader}
              abbrev={abbrev}
              hasFastestLap={hasFastestLap}
              fastestLapSessionLine={fastestLapSessionLine}
              onToggle={handleToggleRow}
            />
          )
        })}
      </div>

      {(frameData.time ?? frameData.t) !== undefined && (
        <div className="mt-2 border-t border-[rgba(124,152,158,0.18)] pt-2">
          <div className="font-['Alumni_Sans'] text-[11px] text-[#9FA0C3]">
            Race time{' '}
            <span className="font-mono text-[#E8E8EF]">{formatTime(frameData.time ?? frameData.t ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
