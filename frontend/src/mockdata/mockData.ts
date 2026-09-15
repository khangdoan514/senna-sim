// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — src/mockdata/mockData.ts
// ═══════════════════════════════════════════════════════════════════════════
//
// All data here is consumed directly by page components while the live API
// is not yet connected. To switch to real data, replace each export with a
// useFetch() call or API service import.
//
// API integration points are documented per-export.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  Constructor, EloDriver, EloHistoryPoint,
  Circuit, PerformanceSummary, LapBucket,
  TelemetryCard, TeamTrackPerf, WeatherDriver, ReliabilityTeam,
} from '../types'

// ─── HOME STATS ───────────────────────────────────────────────────────────────
// GET /api/stats/summary
export const homeStats = {
  modelAccuracy:       91.8,
  dataPoints:          '1.2M',
  simulationsPerRace:  '10K',
  circuitsTracked:     24,
}

// ─── CONSTRUCTORS ─────────────────────────────────────────────────────────────
// GET /api/constructors/standings
export const constructors: Constructor[] = [
  { rank:1,  name:'Red Bull Racing', points:412, wins:9,  eloRating:2210, change:+12 },
  { rank:2,  name:'McLaren',         points:374, wins:5,  eloRating:2168, change:+18 },
  { rank:3,  name:'Ferrari',         points:341, wins:4,  eloRating:2141, change:+4  },
  { rank:4,  name:'Mercedes',        points:298, wins:2,  eloRating:2089, change:+9  },
  { rank:5,  name:'Aston Martin',    points:197, wins:0,  eloRating:1991, change:-4  },
  { rank:6,  name:'Alpine',          points:142, wins:0,  eloRating:1944, change:+1  },
  { rank:7,  name:'Williams',        points:121, wins:0,  eloRating:1922, change:-3  },
  { rank:8,  name:'Racing Bulls',    points:98,  wins:0,  eloRating:1897, change:+5  },
  { rank:9,  name:'Haas F1 Team',    points:71,  wins:0,  eloRating:1861, change:-1  },
  { rank:10, name:'Audi',            points:48,  wins:0,  eloRating:1832, change:0   },
  { rank:11, name:'Cadillac',        points:22,  wins:0,  eloRating:1798, change:+2  },
]

// ─── ELO DRIVERS ─────────────────────────────────────────────────────────────
// GET /api/elo/rankings?type=drivers
export const eloDrivers: EloDriver[] = [
  { rank:1,  name:'Max Verstappen',   team:'Red Bull Racing', teamColor:'#3671c6', rating:2187, change:+18 },
  { rank:2,  name:'Lando Norris',     team:'McLaren',         teamColor:'#ff8000', rating:2134, change:+12 },
  { rank:3,  name:'Charles Leclerc',  team:'Ferrari',         teamColor:'#e8002d', rating:2098, change:+6  },
  { rank:4,  name:'Lewis Hamilton',   team:'Ferrari',         teamColor:'#e8002d', rating:2076, change:-4  },
  { rank:5,  name:'George Russell',   team:'Mercedes',        teamColor:'#27f4d2', rating:2041, change:+9  },
  { rank:6,  name:'Carlos Sainz',     team:'Williams',        teamColor:'#1868db', rating:2018, change:-2  },
  { rank:7,  name:'Oscar Piastri',    team:'McLaren',         teamColor:'#ff8000', rating:1994, change:+15 },
  { rank:8,  name:'Fernando Alonso',  team:'Aston Martin',    teamColor:'#229971', rating:1977, change:0   },
  { rank:9,  name:'Lance Stroll',     team:'Aston Martin',    teamColor:'#229971', rating:1892, change:-8  },
  { rank:10, name:'Pierre Gasly',     team:'Alpine',          teamColor:'#00a1e8', rating:1876, change:+3  },
  { rank:11, name:'Esteban Ocon',     team:'Haas F1 Team',    teamColor:'#dee1e2', rating:1864, change:-5  },
  { rank:12, name:'Kimi Antonelli',   team:'Mercedes',        teamColor:'#27f4d2', rating:1852, change:+3  },
  { rank:13, name:'Valtteri Bottas',  team:'Cadillac',        teamColor:'#aaaaad', rating:1851, change:+1  },
  { rank:14, name:'Liam Lawson',      team:'Racing Bulls',    teamColor:'#6692ff', rating:1843, change:+7  },
]

// GET /api/elo/history/:driverId
export const eloHistory: EloHistoryPoint[] = [
  { race:'Bahrain',   rating:2101 },
  { race:'Saudi',     rating:2118 },
  { race:'Australia', rating:2134 },
  { race:'Japan',     rating:2149 },
  { race:'China',     rating:2155 },
  { race:'Miami',     rating:2168 },
  { race:'Monaco',    rating:2187 },
]

// ─── CIRCUITS ─────────────────────────────────────────────────────────────────
// GET /api/circuits
export const CIRCUITS_LIST = [
  'Monaco', 'Silverstone', 'Monza', 'Spa', 'Suzuka',
  'Singapore', 'Baku', 'Austin', 'Interlagos', 'Abu Dhabi',
]

// GET /api/circuits/monaco
export const monacoCircuit: Circuit = {
  id:           'monaco',
  name:         'Monaco',
  fullName:     'Circuit de Monaco',
  nextRace:     'May 25, 2026',
  length:       '3.337 km',
  turns:        19,
  lapRecord:    '1:12.909',
  drsZones:     1,
  grip:         78,
  trackTemp:    34,
  rubberBuildup:'High',
  corners: [
    { num:1,  name:'Sainte Devote',  type:'Right hander',  apexSpeed:'72 km/h',  difficulty:'High'   },
    { num:6,  name:'Casino Square',  type:'Right hander',  apexSpeed:'116 km/h', difficulty:'Medium' },
    { num:10, name:'Mirabeau',       type:'Right hander',  apexSpeed:'60 km/h',  difficulty:'High'   },
    { num:12, name:'Grand Hotel',    type:'Hairpin',        apexSpeed:'48 km/h',  difficulty:'High'   },
    { num:15, name:'Tabac',          type:'Left hander',   apexSpeed:'138 km/h', difficulty:'Medium' },
    { num:17, name:'Swimming Pool',  type:'Chicane',        apexSpeed:'125 km/h', difficulty:'High'   },
    { num:19, name:'Rascasse',       type:'Right hander',  apexSpeed:'54 km/h',  difficulty:'Medium' },
  ],
  weather: [
    { session:'Practice 1', icon:'☀️',  temp:'22°C' },
    { session:'Practice 2', icon:'⛅',  temp:'21°C' },
    { session:'Qualifying', icon:'🌧️', temp:'17°C' },
    { session:'Race',       icon:'⛅',  temp:'19°C' },
  ],
}

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────
// GET /api/performance/summary
export const performanceSummary: PerformanceSummary = {
  avgLapTime:       '1:14.823',
  avgLapDelta:      '▲ 0.341s faster than last race',
  topSpeed:         '334 km/h',
  topSpeedDelta:    '▲ +8 km/h vs last race',
  overtakes:        12,
  overtakesNote:    'Season average: 8.4',
  consistency:      '94.2%',
  consistencyDelta: '▲ 1.8% improvement',
}

// GET /api/performance/lap-distribution
export const lapDistribution: LapBucket[] = [
  { bucket:'<1:13', count:2  },
  { bucket:'1:13',  count:5  },
  { bucket:'1:14',  count:14 },
  { bucket:'1:15',  count:18 },
  { bucket:'1:16',  count:9  },
  { bucket:'1:17',  count:4  },
  { bucket:'>1:18', count:2  },
]

// ─── DRIVER PROFILES (legacy — Drivers page now uses inline data) ─────────────
// GET /api/drivers
export const driverProfiles = [
  { name:'Max Verstappen',    number:1,  team:'Red Bull Racing', nationality:'Dutch',      wins:62, podiums:110, eloRating:2187 },
  { name:'Lando Norris',      number:4,  team:'McLaren',         nationality:'British',    wins:8,  podiums:34,  eloRating:2134 },
  { name:'Charles Leclerc',   number:16, team:'Ferrari',         nationality:'Monégasque', wins:8,  podiums:42,  eloRating:2098 },
  { name:'Lewis Hamilton',    number:44, team:'Ferrari',         nationality:'British',    wins:103,podiums:197, eloRating:2076 },
  { name:'George Russell',    number:63, team:'Mercedes',        nationality:'British',    wins:4,  podiums:18,  eloRating:2041 },
  { name:'Carlos Sainz',      number:55, team:'Williams',        nationality:'Spanish',    wins:4,  podiums:25,  eloRating:2018 },
  { name:'Oscar Piastri',     number:81, team:'McLaren',         nationality:'Australian', wins:4,  podiums:16,  eloRating:1994 },
  { name:'Fernando Alonso',   number:14, team:'Aston Martin',    nationality:'Spanish',    wins:32, podiums:106, eloRating:1977 },
  { name:'Kimi Antonelli',    number:12, team:'Mercedes',        nationality:'Italian',    wins:0,  podiums:0,   eloRating:1852 },
  { name:'Sergio Perez',      number:11, team:'Cadillac',        nationality:'Mexican',    wins:9,  podiums:39,  eloRating:1738 },
]

// ─── TELEMETRY ────────────────────────────────────────────────────────────────
// GET /api/telemetry/summary
export const telemetryCards: TelemetryCard[] = [
  { label:'Max Speed',         icon:'⚡', value:'334 km/h', delta:'▲ +8 km/h',    deltaPositive:true  },
  { label:'Avg Throttle',      icon:'🔥', value:'68.4%',    delta:'▲ +2.1%',      deltaPositive:true  },
  { label:'Brake Efficiency',  icon:'🛑', value:'91.2%',    delta:'▼ −0.8%',      deltaPositive:false },
  { label:'ERS Deployment',    icon:'🔋', value:'94.7%',    delta:'▲ +3.2%',      deltaPositive:true  },
]

// GET /api/telemetry/track-performance
export const teamTrackPerf: TeamTrackPerf[] = [
  { team:'Red Bull Racing', circuit:'Monaco',      avgPos:'1.8', lapTimeDelta:'−0.42s', positive:true  },
  { team:'Ferrari',         circuit:'Monza',       avgPos:'2.1', lapTimeDelta:'−0.38s', positive:true  },
  { team:'McLaren',         circuit:'Silverstone', avgPos:'1.9', lapTimeDelta:'−0.31s', positive:true  },
  { team:'Mercedes',        circuit:'Baku',        avgPos:'3.4', lapTimeDelta:'+0.19s', positive:false },
]

// GET /api/telemetry/weather-conditions
export const weatherDrivers: WeatherDriver[] = [
  { name:'Max Verstappen',  drySkill:97, wetSkill:94, rainWins:3,  wetCrashes:1 },
  { name:'Lewis Hamilton',  drySkill:96, wetSkill:98, rainWins:12, wetCrashes:2 },
  { name:'Charles Leclerc', drySkill:95, wetSkill:88, rainWins:1,  wetCrashes:4 },
  { name:'Lando Norris',    drySkill:94, wetSkill:91, rainWins:1,  wetCrashes:3 },
]

// GET /api/telemetry/reliability
export const reliabilityTeams: ReliabilityTeam[] = [
  { name:'Red Bull Racing', dnfRate:'3.2%',  failures:2, completion:'96.8%', rating:'Excellent' },
  { name:'McLaren',         dnfRate:'4.1%',  failures:3, completion:'95.9%', rating:'Excellent' },
  { name:'Mercedes',        dnfRate:'5.8%',  failures:4, completion:'94.2%', rating:'Good'      },
  { name:'Ferrari',         dnfRate:'11.8%', failures:8, completion:'88.2%', rating:'Poor'      },
  { name:'Aston Martin',    dnfRate:'6.4%',  failures:4, completion:'93.6%', rating:'Good'      },
]
