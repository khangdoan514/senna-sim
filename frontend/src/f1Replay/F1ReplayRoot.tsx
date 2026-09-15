import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import SessionSelectionPage from '../features/selection/SessionSelectionPage'
import ReplayPage from '../features/replay/ReplayPage'
import QualifyingPage from '../features/qualifying/QualifyingPage'
import {
  buildReplayWebSocket,
  controlPlayback,
  fetchPredictRace,
  fetchRefLapProfile,
  getCurrentFrame,
  getQualifyingSummary,
  loadSession as apiLoadSession,
  seekFrame,
  setPlaybackSpeed as apiSetPlaybackSpeed,
} from '../lib/api'
import {
  buildDemoFrame,
  austriaRef,
  demoSession,
  ellipseTrack,
  getDemoLaps,
  getPredictiveFrameCount,
  getWinnerRaceS,
  isDemoRace,
  predictiveAustriaCircuitRef,
  refreshPredictiveWinnerCache,
  resetPredictiveRaceGridToBundled,
  setPredictiveRaceGridFromPayload,
  setRefProfile,
  trackFromLoad,
} from '../lib/predictiveSessionDemo'
import {
  fetchSeasonRoundsForYear,
  formatSessionDateLabel,
  isEventDateInFuture,
  type SimulationRoundInfo,
} from '../lib/simulationSchedule'
import type { QualifyingSummary, SessionInfo, TelemetryFrame, TrackBoundaries } from '../types/telemetry'
import { formatFinishClockSeconds } from '../lib/raceLeaderboardDisplay'
import { DRIVER_NAME } from '../lib/whatIfHistorical'

type FinishRow = {
  code: string
  pos: number
  name: string
  team?: string
  color?: string
  carNo?: string | number
  laps?: number
  finish_time_seconds?: number | null
  timeDisplay?: string | null
}

function finishRowsFromTelemetryFrame(frame: TelemetryFrame): FinishRow[] | null {
  const raw: Array<{ key: string; d: TelemetryFrame['drivers'][string] }> = []
  for (const [key, d] of Object.entries(frame.drivers ?? {})) {
    raw.push({ key, d })
  }
  if (raw.length < 3) return null

  const leader = raw.reduce<{ d: TelemetryFrame['drivers'][string] | null; pos: number }>(
    (acc, r) => {
      const p = typeof r.d.position === 'number' ? r.d.position : Number.MAX_SAFE_INTEGER
      if (p < acc.pos) return { d: r.d, pos: p }
      return acc
    },
    { d: null, pos: Number.MAX_SAFE_INTEGER }
  ).d
  const leaderLap = typeof leader?.lap === 'number' ? leader.lap : undefined

  const list: FinishRow[] = []
  for (const { key, d } of raw) {
    const codeRaw = d.abbrev?.trim() ? d.abbrev.trim() : key
    const code = codeRaw.toUpperCase()
    const pos = typeof d.position === 'number' ? d.position : null
    if (pos == null || pos < 1 || pos > 60) continue
    const carNoParsed = Number.parseInt(key, 10)
    const gridFallback = typeof d.grid_position === 'number' ? d.grid_position : undefined
    const carNo = Number.isFinite(carNoParsed) ? carNoParsed : (gridFallback ?? key)
    const laps = typeof d.lap === 'number' ? d.lap : undefined
    let timeDisplay = formatFinishClockSeconds(d.finish_time_seconds ?? undefined)
    if (!timeDisplay) {
      if (pos === 1) {
        timeDisplay = 'LEADER'
      } else if (
        typeof d.gap_to_leader_m === 'number' &&
        Number.isFinite(d.gap_to_leader_m) &&
        d.gap_to_leader_m >= 0
      ) {
        const myLap = typeof d.lap === 'number' ? d.lap : undefined
        if (leaderLap != null && myLap != null && myLap < leaderLap) {
          const lapDeficit = leaderLap - myLap
          timeDisplay = lapDeficit === 1 ? '+1 LAP' : `+${lapDeficit} LAPS`
        } else {
          const speedMps = Math.max((d.speed ?? 0) / 3.6, 25)
          const sec = d.gap_to_leader_m / speedMps
          if (sec > 0 && Number.isFinite(sec)) timeDisplay = `+${sec.toFixed(3)}s`
        }
      }
    }
    const fts =
      typeof d.finish_time_seconds === 'number' && Number.isFinite(d.finish_time_seconds)
        ? d.finish_time_seconds
        : undefined
    list.push({
      code,
      pos,
      name: DRIVER_NAME[code] ?? code,
      team: d.team,
      color: typeof d.color === 'string' && d.color ? d.color : undefined,
      carNo,
      laps,
      finish_time_seconds: fts,
      timeDisplay: timeDisplay ?? undefined,
    })
  }
  if (list.length < 3) return null
  list.sort((a, b) => a.pos - b.pos)
  return list
}

/** Props for a custom session form (e.g. TrackSense `Simulation` styling). */
export type F1SessionFormRenderProps = {
  year: number
  setYear: (y: number) => void
  roundNum: number
  setRoundNum: (r: number) => void
  sessionType: string
  setSessionType: (s: string) => void
  playbackSpeed: number
  setPlaybackSpeed: (v: number) => void
  loading: boolean
  loadError: string | null
  onLoadSession: () => void
  scheduleLoading: boolean
  roundOptions: { value: number; label: string }[]
  selectedEventName: string | null
  selectedEventDateDisplay: string | null
  /** Event is still in the future — predictive lap-time simulation (not historical replay). */
  isPredictiveSelection: boolean
  sessionLoaded: boolean
  sessionMode: 'selection' | 'race' | 'qualifying'
  localPredictive: boolean
  /** Classified order from last historical race frame (for What If). */
  raceFinishLeaderboard: FinishRow[] | null
  raceFinishLoading: boolean
}

type F1ReplayRootProps = {
  /** When set, replaces f1 `SessionSelectionPage` while no session is loaded. */
  renderSessionForm?: (p: F1SessionFormRenderProps) => ReactNode
  /** When false, replay/qualifying panes are hidden (useful for What-If-only views). */
  showReplay?: boolean
}

/**
 * Same behaviour as f1-racing-simulation `App.tsx`, wrapped for TrackSense `/simulation`.
 */
export default function F1ReplayRoot({ renderSessionForm, showReplay = true }: F1ReplayRootProps) {
  const [mode, setMode] = useState<'selection' | 'race' | 'qualifying'>('selection')
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [currentFrame, setCurrentFrame] = useState<TelemetryFrame | null>(null)
  const [totalFrames, setTotalFrames] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [trackBoundaries, setTrackBoundaries] = useState<TrackBoundaries | undefined>(undefined)
  const [qualifyingSummary, setQualifyingSummary] = useState<QualifyingSummary | null>(null)
  const [initialGridMode, setInitialGridMode] = useState(false)

  const [pickerYear, setPickerYear] = useState(2024)
  const [pickerRound, setPickerRound] = useState(4)
  const [pickerSessionType, setPickerSessionType] = useState('R')
  const [sessionLoading, setSessionLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [seasonRounds, setSeasonRounds] = useState<SimulationRoundInfo[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [localPredictive, setLocalPredictive] = useState(false)
  const [raceFinishLeaderboard, setRaceFinishLeaderboard] = useState<FinishRow[] | null>(null)
  const [raceFinishLoading, setRaceFinishLoading] = useState(false)
  /** Bumps when FastF1 reference lap telemetry arrives — rebuilds predictive frames with real pedals/speed. */
  const [demoRefEpoch, setDemoRefEpoch] = useState(0)

  const animationFrameRef = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const demoTrackRef = useRef<TrackBoundaries>(ellipseTrack)
  /** Winner cumulative race clock τ (s), kept in sync with scrub for predictive play. */
  const demoTauRef = useRef(0)

  /** Rebuild predictive telemetry whenever lap frame index changes (JSON lap times). */
  useEffect(() => {
    if (!localPredictive || mode !== 'race' || !sessionLoaded) return
    setCurrentFrame(buildDemoFrame(demoTrackRef.current, frameIndex))
  }, [localPredictive, mode, sessionLoaded, frameIndex, demoRefEpoch])

  /** Align τ with scrubber: τ = (frameIndex / maxIndex) × winner race duration. */
  useEffect(() => {
    if (!localPredictive) return
    const n = Math.max(1, totalFrames)
    const maxFi = Math.max(1, n - 1)
    const T = getWinnerRaceS()
    demoTauRef.current = (Math.min(maxFi, Math.max(0, frameIndex)) / maxFi) * T
  }, [localPredictive, frameIndex, totalFrames])

  /**
   * Predictive play: race clock τ advances `playbackSpeed`× wall seconds per wall second
   * (2× → 2 s race in 1 s wall). At 1×, full run takes the winner’s total race time from the active predictive grid.
   */
  useEffect(() => {
    if (!localPredictive || !isPlaying) return
    const n = Math.max(1, totalFrames)
    const maxFi = Math.max(1, n - 1)
    const T = getWinnerRaceS()
    let tau = demoTauRef.current
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dw = (now - last) / 1000
      last = now
      tau += dw * Math.max(0.25, playbackSpeed)
      if (tau >= T) {
        tau = T
        demoTauRef.current = T
        setFrameIndex(maxFi)
        queueMicrotask(() => setIsPlaying(false))
        return
      }
      demoTauRef.current = tau
      const idx = Math.min(maxFi, Math.floor((tau / T) * maxFi + 1e-12))
      setFrameIndex(idx)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [localPredictive, isPlaying, playbackSpeed, totalFrames])

  useEffect(() => {
    let cancelled = false
    setScheduleLoading(true)
    void fetchSeasonRoundsForYear(pickerYear).then((rows) => {
      if (cancelled) return
      setSeasonRounds(rows)
      setScheduleLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [pickerYear])

  useEffect(() => {
    if (scheduleLoading || !seasonRounds.length) return
    if (!seasonRounds.some((r) => r.round_number === pickerRound)) {
      setPickerRound(seasonRounds[0].round_number)
    }
  }, [scheduleLoading, seasonRounds, pickerRound])

  const selectedMeta = useMemo(() => {
    if (scheduleLoading || !seasonRounds.length) return null
    return seasonRounds.find((r) => r.round_number === pickerRound) ?? null
  }, [scheduleLoading, seasonRounds, pickerRound])

  const roundOptions = useMemo(() => {
    if (scheduleLoading || !seasonRounds.length) {
      return Array.from({ length: 24 }, (_, i) => ({
        value: i + 1,
        label: `Round ${i + 1}`,
      }))
    }
    return seasonRounds.map((r) => ({
      value: r.round_number,
      label: `R${r.round_number} — ${r.event_name}`,
    }))
  }, [scheduleLoading, seasonRounds])

  const isPredictiveSelection = Boolean(
    selectedMeta && isEventDateInFuture(selectedMeta.date)
  )

  const selectedEventName = selectedMeta?.event_name ?? null
  const selectedEventDateDisplay = selectedMeta?.date
    ? formatSessionDateLabel(selectedMeta.date)
    : null

  const fetchCurrentFrame = useCallback(async () => {
    try {
      const data = await getCurrentFrame()
      if (data.frame) {
        setCurrentFrame(data.frame)
        setFrameIndex(data.frame_index)
        setTotalFrames(data.total_frames)
        setIsPlaying(data.is_playing)
        setPlaybackSpeed(data.playback_speed)
      }
    } catch (error) {
      console.error('Failed to fetch frame:', error)
    }
  }, [])

  useEffect(() => {
    if (!sessionLoaded || mode !== 'race' || localPredictive) {
      setRaceFinishLeaderboard(null)
      setRaceFinishLoading(false)
    } else if (!raceFinishLeaderboard) {
      // Preserve existing behavior while we await final-frame snapshot.
      setRaceFinishLeaderboard(currentFrame ? finishRowsFromTelemetryFrame(currentFrame) : null)
    }
  }, [sessionLoaded, mode, localPredictive, currentFrame, raceFinishLeaderboard])

  useEffect(() => {
    if (!sessionLoaded || mode !== 'race' || localPredictive) return
    const ws = buildReplayWebSocket()
    wsRef.current = ws
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === 'frame') {
          setCurrentFrame(data.frame)
          setFrameIndex(data.frame_index)
          setTotalFrames(data.total_frames)
          setIsPlaying(data.is_playing)
          setPlaybackSpeed(data.playback_speed)
        }
      } catch {
        /* ignore malformed ws payloads */
      }
    }

    const loop = async () => {
      await fetchCurrentFrame()
      animationFrameRef.current = requestAnimationFrame(loop)
    }
    animationFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      ws.close()
    }
  }, [fetchCurrentFrame, mode, sessionLoaded, localPredictive])

  const runLoadSession = async (year: number, round: number, sessionType: string = 'R') => {
    setSessionLoading(true)
    setLoadError(null)
    setLocalPredictive(false)
    setRefProfile(null)

    if (isDemoRace(year, round, sessionType)) {
      try {
        let track: TrackBoundaries = ellipseTrack
        try {
          const ref = await apiLoadSession(
            austriaRef.year,
            austriaRef.round,
            'R',
            false
          )
          const parsed = trackFromLoad(ref)
          if (parsed) track = parsed
        } catch (e) {
          console.warn(
            '[predictive] Could not load Austria layout from reference session; using fallback outline.',
            e
          )
        }
        demoTrackRef.current = track
        try {
          const payload = await fetchPredictRace({ circuit_ref: predictiveAustriaCircuitRef })
          const applied =
            Array.isArray(payload) &&
            payload.length > 0 &&
            setPredictiveRaceGridFromPayload(payload)
          if (!applied) {
            resetPredictiveRaceGridToBundled()
            refreshPredictiveWinnerCache()
            console.warn('[predictive] /api/predict/race returned empty or invalid data; using bundled grid JSON.')
          } else {
            refreshPredictiveWinnerCache()
          }
        } catch (e) {
          resetPredictiveRaceGridToBundled()
          refreshPredictiveWinnerCache()
          console.warn('[predictive] /api/predict/race failed; using bundled grid JSON.', e)
        }
        const laps = getDemoLaps()
        setSessionInfo({ ...demoSession, total_laps: laps })
        setTrackBoundaries({ ...track })
        const nFrames = Math.max(1, getPredictiveFrameCount())
        setTotalFrames(nFrames)
        setFrameIndex(0)
        setCurrentFrame(buildDemoFrame(track, 0))
        setIsPlaying(false)
        setInitialGridMode(true)
        setSessionLoaded(true)
        setMode('race')
        setLocalPredictive(true)
        setRaceFinishLeaderboard(null)
        setRaceFinishLoading(false)
        setQualifyingSummary(null)
        void fetchRefLapProfile(austriaRef.year, austriaRef.round)
          .then((data) => {
            if (data?.status === 'ok' && data.samples && data.samples.length > 0) {
              setRefProfile({
                samples: data.samples,
                reference_lap_seconds:
                  typeof data.reference_lap_seconds === 'number' ? data.reference_lap_seconds : null,
                driver_abbrev: typeof data.driver_abbrev === 'string' ? data.driver_abbrev : null,
              })
              setDemoRefEpoch((e) => e + 1)
            }
          })
          .catch(() => {
            /* heuristic telemetry only */
          })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to open predictive session'
        setLoadError(msg)
      } finally {
        setSessionLoading(false)
      }
      return
    }

    try {
      const data = await apiLoadSession(year, round, sessionType)
      if (data?.status !== 'loaded') {
        const d = data?.detail
        const msg =
          typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: unknown) => String(x)).join(', ') : 'Failed to load session'
        throw new Error(msg)
      }
      await apiSetPlaybackSpeed(playbackSpeed)
      setSessionInfo({
        ...(data.session_info ?? {}),
        total_laps:
          typeof data.total_laps === 'number'
            ? data.total_laps
            : (data.session_info?.total_laps ?? undefined),
      })
      setTotalFrames(data.total_frames)
      setTrackBoundaries({
        inner: data.track_boundaries?.inner ?? { x: [], y: [] },
        outer: data.track_boundaries?.outer ?? { x: [], y: [] },
        center: data.track_boundaries?.center ?? { x: [], y: [] },
        corridorWidthM: data.track_boundaries?.corridor_width_m ?? 220,
        sectorSplits: data.track_boundaries?.sector_splits ?? [],
        drsZones: data.track_boundaries?.drs_zones ?? [],
        finishLine: data.track_boundaries?.finish_line
          ? data.track_boundaries.finish_line
          : { x: [], y: [] },
      })
      setSessionLoaded(true)
      setInitialGridMode(true)
      setRaceFinishLoading(true)
      if (data.mode === 'qualifying') {
        setMode('qualifying')
        setRaceFinishLeaderboard(null)
        const summary = await getQualifyingSummary()
        setQualifyingSummary(summary)
      } else {
        setMode('race')
        await fetchCurrentFrame()
        try {
          // For What-If, snapshot classified order from the last frame (race end).
          setRaceFinishLoading(true)
          const before = await getCurrentFrame()
          const beforeIdx = typeof before?.frame_index === 'number' ? before.frame_index : 0
          const lastIdx = Math.max(0, (data.total_frames ?? 1) - 1)
          await seekFrame(lastIdx)
          const tail = await getCurrentFrame()
          setRaceFinishLeaderboard(tail?.frame ? finishRowsFromTelemetryFrame(tail.frame) : null)
          await seekFrame(beforeIdx)
          await fetchCurrentFrame()
        } catch {
          // Fallback to whatever frame is currently available.
          setRaceFinishLeaderboard(currentFrame ? finishRowsFromTelemetryFrame(currentFrame) : null)
        } finally {
          setRaceFinishLoading(false)
        }
        // Always open race replay at start grid, never at race-end frame.
        await seekFrame(0)
        await fetchCurrentFrame()
        setFrameIndex(0)
        setIsPlaying(false)
        setInitialGridMode(true)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load session'
      setLoadError(msg)
      console.error('Failed to load session:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const loadSessionFromF1Selector = (year: number, round: number, sessionType: string = 'R') =>
    runLoadSession(year, round, sessionType)

  const loadSessionFromTrackSensePicker = () =>
    runLoadSession(pickerYear, pickerRound, pickerSessionType)

  const handlePlay = async () => {
    setInitialGridMode(false)
    if (localPredictive) {
      const n = Math.max(1, totalFrames, getPredictiveFrameCount())
      setFrameIndex((prev) => (prev >= n - 1 ? 0 : prev))
      setIsPlaying(true)
      return
    }
    await controlPlayback('play')
  }

  const handlePause = async () => {
    if (localPredictive) {
      setIsPlaying(false)
      return
    }
    await controlPlayback('pause')
  }

  const handleRestart = async () => {
    setInitialGridMode(true)
    if (localPredictive) {
      setFrameIndex(0)
      setIsPlaying(false)
      return
    }
    await controlPlayback('restart')
    await fetchCurrentFrame()
  }

  const handleSpeedChange = async (speed: number) => {
    if (localPredictive) {
      setPlaybackSpeed(speed)
      return
    }
    await apiSetPlaybackSpeed(speed)
    setPlaybackSpeed(speed)
  }

  const handleSeek = async (frame: number) => {
    if (frame > 0) setInitialGridMode(false)
    if (localPredictive) {
      const n = Math.max(1, totalFrames)
      const clamped = Math.max(0, Math.min(n - 1, frame))
      setFrameIndex(clamped)
      return
    }
    await seekFrame(frame)
    await fetchCurrentFrame()
  }

  const formProps: F1SessionFormRenderProps = {
    year: pickerYear,
    setYear: setPickerYear,
    roundNum: pickerRound,
    setRoundNum: setPickerRound,
    sessionType: pickerSessionType,
    setSessionType: setPickerSessionType,
    playbackSpeed,
    setPlaybackSpeed,
    loading: sessionLoading,
    loadError,
    onLoadSession: loadSessionFromTrackSensePicker,
    scheduleLoading,
    roundOptions,
    selectedEventName,
    selectedEventDateDisplay,
    isPredictiveSelection,
    sessionLoaded,
    sessionMode: mode,
    localPredictive,
    raceFinishLeaderboard,
    raceFinishLoading,
  }

  return (
    <div className="w-full min-w-0 text-white">
      <main className="flex w-full flex-col gap-4 py-6 sm:py-8">
        {renderSessionForm ? renderSessionForm(formProps) : <SessionSelectionPage onLoadSession={loadSessionFromF1Selector} />}

        {showReplay && sessionLoaded && mode === 'race' && (
          <ReplayPage
            currentFrame={currentFrame}
            sessionInfo={sessionInfo}
            trackBoundaries={trackBoundaries}
            initialGridMode={initialGridMode}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            frameIndex={frameIndex}
            totalFrames={totalFrames}
            onPlay={handlePlay}
            onPause={handlePause}
            onRestart={handleRestart}
            onSpeedChange={handleSpeedChange}
            onSeek={handleSeek}
          />
        )}

        {showReplay && sessionLoaded && mode === 'qualifying' && <QualifyingPage summary={qualifyingSummary} />}
      </main>
    </div>
  )
}
