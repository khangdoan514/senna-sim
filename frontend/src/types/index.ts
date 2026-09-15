// ═══════════════════════════════════════════════════════════════════════════
// TRACKSENSE — Shared TypeScript Types
// src/types/index.ts
// ═══════════════════════════════════════════════════════════════════════════

// ─── DRIVER ───────────────────────────────────────────────────────────────────

export interface Driver {
  id:          string
  number:      number
  name:        string
  short:       string          // 3-letter code e.g. "VER"
  team:        string
  nationality: string
  flag:        string          // emoji flag
  color:       string          // hex team colour
  wins:        number
  podiums:     number
  eloRating:   number
}

export interface DriverProfile extends Driver {
  bio:         string
  stats:       { label: string; value: string }[]
  moment:      { caption: string; year: string }
  eloHistory:  number[]        // per-race values for current season
}

// ─── CONSTRUCTOR ─────────────────────────────────────────────────────────────

export interface Constructor {
  rank:      number
  name:      string
  points:    number
  wins:      number
  eloRating: number
  change?:   number
}

// ─── ELO ─────────────────────────────────────────────────────────────────────

export interface EloDriver {
  rank:   number
  name:   string
  team:   string
  teamColor: string
  rating: number
  change: number
}

export interface EloHistoryPoint {
  race:   string
  rating: number
}

// ─── CIRCUIT ─────────────────────────────────────────────────────────────────

export interface Corner {
  num:        number
  name:       string
  type:       string
  apexSpeed:  string
  difficulty: 'High' | 'Medium' | 'Low'
}

export interface WeatherSlot {
  session: string
  icon:    string
  temp:    string
}

export interface Circuit {
  id:           string
  name:         string
  fullName:     string
  nextRace:     string
  length:       string
  turns:        number
  lapRecord:    string
  drsZones:     number
  grip:         number
  trackTemp:    number
  rubberBuildup:'High' | 'Medium' | 'Low'
  corners:      Corner[]
  weather:      WeatherSlot[]
}

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────

export interface PerformanceSummary {
  avgLapTime:       string
  avgLapDelta:      string
  topSpeed:         string
  topSpeedDelta:    string
  overtakes:        string | number
  overtakesNote:    string
  consistency:      string
  consistencyDelta: string
}

export interface LapBucket {
  bucket: string
  count:  number
}

// ─── TELEMETRY ────────────────────────────────────────────────────────────────

export interface TelemetryCard {
  label:         string
  icon:          string
  value:         string
  delta:         string
  deltaPositive: boolean
}

export interface TeamTrackPerf {
  team:          string
  circuit:       string
  avgPos:        string
  lapTimeDelta:  string
  positive:      boolean
}

export interface WeatherDriver {
  name:       string
  drySkill:   number
  wetSkill:   number
  rainWins:   number
  wetCrashes: number
}

export interface ReliabilityTeam {
  name:       string
  dnfRate:    string
  failures:   number
  completion: string
  rating:     'Excellent' | 'Good' | 'Poor'
}

// ─── SIMULATION ──────────────────────────────────────────────────────────────

export interface SimDriverPosition {
  pos:   number
  code:  string
  team:  string
  color: string
  x:     number
  y:     number
  speed: number
  gear:  number
  lap:   number
  gap:   string
}

export interface SimFrame {
  frame:      number
  t:          number
  progress:   number
  lap:        number
  total_laps: number
  positions:  SimDriverPosition[]
}

export interface TrackMap {
  x:        number[]
  y:        number[]
  rotation: number
}

export interface SessionInfo {
  event_name:   string
  total_laps:   number
  duration_s:   number
  driver_count: number
}

// ─── API RESPONSE WRAPPER ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T
  success: boolean
  error?:  string
}
