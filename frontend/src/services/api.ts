// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE — src/services/api.ts
// ═══════════════════════════════════════════════════════════════════════════
//
// All API calls go through this file. Each function mirrors a mock data
// export in mockData.ts — swap them in page components one at a time.
//
// BASE URL is read from VITE_API_URL env var (set in .env.local).
// Defaults to http://localhost:8000 for local FastAPI dev server.
//
// Usage in a component:
//   import { fetchConstructorStandings } from '../services/api'
//   const data = await fetchConstructorStandings()
// ═══════════════════════════════════════════════════════════════════════════

import type {
  Constructor, EloDriver, EloHistoryPoint,
  Circuit, PerformanceSummary, LapBucket,
  TelemetryCard, TeamTrackPerf, WeatherDriver, ReliabilityTeam,
  SessionInfo, TrackMap, ApiResponse,
} from '../types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail ?? `HTTP ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `HTTP ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

export const fetchHomeSummary = () =>
  get<{ modelAccuracy: number; dataPoints: string; simulationsPerRace: string; circuitsTracked: number }>(
    '/api/stats/summary'
  )

// ─── ELO ─────────────────────────────────────────────────────────────────────

export const fetchEloDrivers      = ()         => get<EloDriver[]>('/api/elo/rankings?type=drivers')
export const fetchEloConstructors = ()         => get<Constructor[]>('/api/elo/rankings?type=constructors')
export const fetchEloHistory      = (id: string) => get<EloHistoryPoint[]>(`/api/elo/history/${id}`)

export const fetchHeadToHead = (d1: string, d2: string) =>
  post<{ d1WinProb: number; d2WinProb: number; ratingDelta: number }>('/api/elo/head-to-head', { d1, d2 })

// ─── CONSTRUCTORS ────────────────────────────────────────────────────────────

export const fetchConstructorStandings = () => get<Constructor[]>('/api/constructors/standings')
export const fetchConstructorTechnical = (id: string) => get<unknown>(`/api/constructors/${id}/technical`)
export const fetchConstructorDevelopments = () => get<unknown[]>('/api/constructors/developments')

// ─── CIRCUITS ────────────────────────────────────────────────────────────────

export const fetchCircuitList   = ()         => get<string[]>('/api/circuits')
export const fetchCircuit       = (id: string) => get<Circuit>(`/api/circuits/${id}`)
export const fetchCircuitWeather= (id: string) => get<unknown>(`/api/circuits/${id}/weather`)

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────

export const fetchPerformanceSummary      = () => get<PerformanceSummary>('/api/performance/summary')
export const fetchLapDistribution         = () => get<LapBucket[]>('/api/performance/lap-distribution')
export const fetchSectorTimes             = () => get<unknown[]>('/api/performance/sector-times')
export const fetchPerformanceInsights     = () => get<unknown[]>('/api/performance/insights')
export const fetchLapTimes                = (driver: string) => get<unknown[]>(`/api/performance/lap-times?driver=${driver}`)

// ─── TELEMETRY ────────────────────────────────────────────────────────────────

export const fetchTelemetrySummary    = () => get<TelemetryCard[]>('/api/telemetry/summary')
export const fetchTrackPerformance    = () => get<TeamTrackPerf[]>('/api/telemetry/track-performance')
export const fetchWeatherConditions   = () => get<WeatherDriver[]>('/api/telemetry/weather-conditions')
export const fetchReliability         = () => get<ReliabilityTeam[]>('/api/telemetry/reliability')
export const fetchPredictionModel     = () => get<unknown>('/api/telemetry/prediction-model')

// ─── SIMULATION ──────────────────────────────────────────────────────────────

export const loadSimulationSession = (year: number, round: number, sessionType: string) =>
  post<{ session_id: string; event_name: string; total_laps: number; duration_s: number; driver_count: number }>(
    '/api/simulation/load-session',
    { year, round, session_type: sessionType }
  )

export const fetchTrackMap = (sessionId: string) =>
  get<TrackMap>(`/api/simulation/${sessionId}/track`)

// WebSocket factory — call this after loadSimulationSession
export function createSimulationWebSocket(sessionId: string): WebSocket {
  const wsBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
    .replace(/^http/, 'ws')
  return new WebSocket(`${wsBase}/ws/simulation/${sessionId}`)
}

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

export const fetchDrivers        = ()         => get<unknown[]>('/api/drivers')
export const fetchDriver         = (id: string) => get<unknown>(`/api/drivers/${id}`)
export const fetchSeasonStandings= ()         => get<unknown[]>('/api/drivers/season-standings')
