export interface DriverTelemetry {
  x: number
  y: number
  dist?: number
  gap_to_leader_m?: number | null // Gap behind leader, same lap
  lap?: number
  position?: number
  grid_position?: number // Grid slot from results
  abbrev?: string
  team?: string
  compound?: string
  tyre?: number // Tyre index, minus one unknown
  pitting?: boolean
  out?: boolean // DNF, telemetry ended early
  finished?: boolean // Classified finisher still
  finish_time_seconds?: number | null // Finish time since session start
  pit_stops?: number // Pit stops completed so far
  speed: number
  gear: number
  throttle: number
  brake: number
  drs: number
  color: string
}

export interface TelemetryFrame {
  time?: number
  t?: number
  predictive_gap_model?: boolean
  
  // Running best full lap
  fastest_lap?: {
    abbrev: string
    time_seconds: number
    lap?: number
  } | null
  
  // Running best sector times
  sector_fastest?: {
    '1': { abbrev: string; time_seconds: number | null } | null
    '2': { abbrev: string; time_seconds: number | null } | null
    '3': { abbrev: string; time_seconds: number | null } | null
  }

  drivers: {
    [driverCode: string]: DriverTelemetry
  }

  // Track status code and message
  track_status?: {
    status: number
    message: string
  }

  weather?: {
    track_temp?: number
    air_temp?: number
    humidity?: number
    pressure?: number
    rainfall?: number
    wind_speed?: number
    wind_direction?: number
    rain_state?: string
  }

  safety_car?: {
    x: number
    y: number
    phase: 'deploying' | 'on_track' | 'returning'
    alpha: number
  } | null
}

export interface SessionInfo {
  event_name: string
  round: number
  country: string
  location: string
  date: string
  total_laps?: number | null
  
  // Overall session fastest lap
  fastest_lap?: {
    abbrev: string
    time_seconds: number
    lap?: number
  } | null
}

export interface CircuitInfo {
  rotation: number
  bounds: {
    min_x: number
    max_x: number
    min_y: number
    max_y: number
  }
}

export interface TrackBoundaries {
  inner: { x: number[]; y: number[] }
  outer: { x: number[]; y: number[] }
  center?: { x: number[]; y: number[] } // Centerline for corridor drawing
  corridorWidthM?: number
  sectorSplits?: number[] // Sector ends as lap fractions
  drsZones?: Array<{ start: number; end: number }>
  finishLine?: { x: number[]; y: number[] }
}

export interface PlaybackState {
  is_playing: boolean
  current_frame: number
  playback_speed: number
  total_frames: number
}

export interface QualifyingSummary {
  results: Array<{ code: string; full_name: string; position: number; Q1: string | null; Q2: string | null; Q3: string | null }>
  telemetry: Record<string, { full_name: string; segments: Record<string, Array<{
    t: number
    telemetry: {
      x: number
      y: number
      dist: number
      rel_dist: number
      speed: number
      gear: number
      throttle: number
      brake: number
      drs: number
    }
  }>> }>
}