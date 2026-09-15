/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONSTRUCTORS — src/pages/Constructors.tsx
 * Route: /constructors
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Constructor championship standings with team detail cards, technical
 * performance breakdowns, and a recent developments feed.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Team cards (2-col grid) — colored livery card per constructor showing
 *    logo, rank, drivers, points, wins, ELO, championships, engine, base
 *  • Technical Performance   — aerodynamics / power unit / reliability bars
 *    for the top 4 teams with their individual color accents
 *  • Recent Developments     — 3-item feed of car upgrades introduced mid-season
 *
 * ─── LOGO ASSETS ─────────────────────────────────────────────────────────────
 *  src/assets/img/constructor_logos/{teamId}.png
 *  teamId values are set in TEAM_DETAILS below (e.g. 'ferrari', 'mclaren').
 *  Currently present: ferrari, mclaren, red_bull_racing.
 *  Missing logos fall back to hand-drawn SVG illustrations (SvgFallback).
 *  Add remaining logos as {teamId}.png to unlock them automatically.
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/constructors/standings?season=2026
 *    → Constructor[]  { rank, name, points, wins, eloRating }
 *    Replace: MOCK_CONSTRUCTORS constant below
 *
 *  GET /api/constructors/technical?season=2026
 *    → { team, overall, metrics: { label, pct }[] }[]
 *    Replace: TECHNICAL constant below (currently top 4 teams only)
 *
 *  GET /api/constructors/developments?season=2026&limit=3
 *    → { title, team, body, race }[]
 *    Replace: DEVELOPMENTS constant below
 *    Note: `team` field is matched via partial string to TEAM_DETAILS keys —
 *          use full team name in the API response for a reliable match
 *
 * ─── MOCK DATA TO REPLACE ────────────────────────────────────────────────────
 *  MOCK_CONSTRUCTORS  — 10 teams with points/wins/ELO
 *  TEAM_DETAILS       — static lookup: color, drivers, base, championships, engine
 *                       (semi-static — update when driver lineup changes)
 *  TECHNICAL          — performance bar data for top 4 teams
 *  DEVELOPMENTS       — 3 recent car upgrade entries
 */

import { useState } from 'react'
import { PAGE, INNER, PANEL, BORDER, H2, META, PAGE_HEADER } from '../components/layout'
import DRSSweep from '../components/DRSSweep'
import SectionDivider from '../components/SectionDivider'

// ─── LOGO IMAGES ─────────────────────────────────────────────────────────────
// Vite glob-imports everything in src/assets/img/constructors_logos/
// Name files to match the teamId values in TEAM_DETAILS below.
//
// Expected filenames:
//   red_bull_racing.png   mclaren.png    ferrari.png    mercedes.png
//   aston_martin.png      alpine.png     williams.png   racing_bulls.png
//   haas.png              audi.png       cadillac.png


const LOGOS = import.meta.glob(
  '../assets/img/constructor_logos/*',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>

function getLogoUrl(teamId: string): string | null {
  for (const ext of ['avif', 'png', 'svg', 'jpg', 'webp']) {
    const hit = Object.entries(LOGOS).find(([k]) => k.endsWith(`/${teamId}logowhite.${ext}`))
    if (hit) return hit[1]
  }
  return null
}

function getCarUrl(teamId: string): string | null {
  for (const ext of ['avif', 'png', 'svg', 'jpg', 'webp']) {
    const hit = Object.entries(LOGOS).find(([k]) => k.endsWith(`/${teamId}carright.${ext}`))
    if (hit) return hit[1]
  }
  return null
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Replace with: GET /api/constructors/standings?season=2026  →  Constructor[]
interface Constructor { rank:number; name:string; points:number; wins:number; eloRating:number }

const MOCK_CONSTRUCTORS: Constructor[] = [
  { rank:1,  name:'Mercedes',        points:262, wins:0, eloRating:0 },
  { rank:2,  name:'Ferrari',         points:190,  wins:0, eloRating:0 },
  { rank:3,  name:'McLaren',         points:141,  wins:0, eloRating:0 },
  { rank:4,  name:'Red Bull Racing', points:89,  wins:0, eloRating:0 },
  { rank:5,  name:'Alpine',          points:57,  wins:0, eloRating:0 },
  { rank:6,  name:'Racing Bulls',    points:41,  wins:0, eloRating:0 },
  { rank:7,  name:'Haas F1 Team',    points:21,  wins:0, eloRating:0 },
  { rank:8,  name:'Williams',        points:11,   wins:0, eloRating:0 },
  { rank:9,  name:'Audi',            points:2,   wins:0, eloRating:0 },
  { rank:10, name:'Aston Martin',    points:1,   wins:0, eloRating:0 },
  { rank:11, name:'Cadillac',        points:0,   wins:0, eloRating:0 },
]

const TEAM_DETAILS: Record<string, {
  color:string; lightColor:string
  teamId:string   // ← must match your filename (without extension)
  drivers:[string,string]; base:string; championships:number; engine:string; principal:string
}> = {
  'Red Bull Racing': { color:'#1e41ff', lightColor:'#4a6aff', teamId:'2026redbullracing', drivers:['Max Verstappen','Sergio Perez'],    base:'Milton Keynes, UK',   championships:6,  engine:'Honda RBPT', principal:'Christian Horner'  },
  'McLaren':         { color:'#ff8700', lightColor:'#ffaa44', teamId:'2026mclaren',         drivers:['Lando Norris','Oscar Piastri'],     base:'Woking, UK',          championships:8,  engine:'Mercedes',   principal:'Andrea Stella'      },
  'Ferrari':         { color:'#dc0000', lightColor:'#ff3333', teamId:'2026ferrari',         drivers:['Charles Leclerc','Lewis Hamilton'], base:'Maranello, Italy',    championships:16, engine:'Ferrari',    principal:'Frédéric Vasseur'   },
  'Mercedes':        { color:'#00d2be', lightColor:'#33e8d6', teamId:'2026mercedes',        drivers:['George Russell','Kimi Antonelli'],  base:'Brackley, UK',        championships:8,  engine:'Mercedes',   principal:'Toto Wolff'         },
  'Aston Martin':    { color:'#006f62', lightColor:'#00a08f', teamId:'2026astonmartin',    drivers:['Fernando Alonso','Lance Stroll'],   base:'Silverstone, UK',     championships:0,  engine:'Honda RBPT', principal:'Mike Krack'         },
  'Alpine':          { color:'#0090ff', lightColor:'#44b0ff', teamId:'2026alpine',          drivers:['Pierre Gasly','Esteban Ocon'],      base:'Enstone, UK',         championships:2,  engine:'Renault',    principal:'Bruno Famin'        },
  'Williams':        { color:'#005aff', lightColor:'#3380ff', teamId:'2026williams',        drivers:['Alexander Albon','Carlos Sainz'],   base:'Grove, UK',           championships:9,  engine:'Mercedes',   principal:'James Vowles'       },
  'Racing Bulls':              { color:'#6692ff', lightColor:'#88aaff', teamId:'2026racingbulls',              drivers:['Yuki Tsunoda','Daniel Ricciardo'],  base:'Faenza, Italy',       championships:0,  engine:'Honda RBPT', principal:'Laurent Mekies'     },
  'Haas F1 Team':            { color:'#b6babd', lightColor:'#d0d4d8', teamId:'2026haasf1team',            drivers:['Kevin Magnussen','Nico Hulkenberg'],base:'Kannapolis, USA',     championships:0,  engine:'Ferrari',    principal:'Ayao Komatsu'       },
  'Audi':          { color:'#52e252', lightColor:'#7aef7a', teamId:'2026audi',          drivers:['Valtteri Bottas','Zhou Guanyu'],    base:'Hinwil, Switzerland', championships:0,  engine:'Ferrari',    principal:'Alessandro Alunni'  },
  'Cadillac':          { color:'#C0B072', lightColor:'#C0B072', teamId:'2026cadillac',          drivers:['Valtteri Bottas','Zhou Guanyu'],    base:'Hinwil, Switzerland', championships:0,  engine:'Ferrari',    principal:'Alessandro Alunni'  },
}

// ─── SVG FALLBACK LOGOS ───────────────────────────────────────────────────────
function SvgFallback({ name, color, size }: { name:string; color:string; size:number }) {
  const s = size
  const map: Record<string, React.ReactNode> = {
    'Red Bull Racing': <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M18 27 C12 27 8 23 8 18 C8 13 11 10 15 9 L13 5 C11 3 9 4 8 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M18 27 C24 27 28 23 28 18 C28 13 25 10 21 9 L23 5 C25 3 27 4 28 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><ellipse cx="18" cy="19" rx="7" ry="7.5" fill={`${color}22`} stroke={color} strokeWidth="1.4"/><circle cx="15" cy="17" r="1.4" fill={color}/><circle cx="21" cy="17" r="1.4" fill={color}/></svg>,
    'McLaren':         <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M4 22 C6 16 12 12 18 12 C24 12 30 16 32 22" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/><circle cx="18" cy="13" r="3" fill={color} opacity="0.9"/></svg>,
    'Ferrari':         <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M16 29 L16 21 C13 20 11 17 12 14 C13 11 15 10 16 11 L17 7 C16 5 14 4 13 5 C15 2 18 3 19 6 L20 10 C22 9 24 10 25 13 C26 16 24 19 22 20 L22 29 Z" fill={`${color}30`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 9 L18 5 L28 9 L28 20 C28 26 18 32 18 32 C18 32 8 26 8 20 Z" stroke={color} strokeWidth="1.1" fill="none" opacity="0.3"/></svg>,
    'Mercedes':        <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="13" stroke={color} strokeWidth="1.5" fill={`${color}10`}/><circle cx="18" cy="18" r="3.5" fill={color}/><line x1="18" y1="5" x2="18" y2="14.5" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="14.5" x2="27" y2="27.5" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="14.5" x2="9" y2="27.5" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
    'Aston Martin':    <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M18 18 C13 15 7 13 3 15 C5 12 9 11 13 13 C15.5 14 17 16 18 18 Z" fill={color} opacity="0.9"/><path d="M18 18 C23 15 29 13 33 15 C31 12 27 11 23 13 C20.5 14 19 16 18 18 Z" fill={color} opacity="0.9"/><ellipse cx="18" cy="19.5" rx="4" ry="3" fill={color}/></svg>,
    'Alpine':          <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M18 6 L30 28 L6 28 Z" stroke={color} strokeWidth="1.8" fill={`${color}15`} strokeLinejoin="round"/><path d="M12 28 L18 14 L24 28" stroke={color} strokeWidth="1.4" fill={`${color}22`} strokeLinejoin="round"/><line x1="14" y1="22" x2="22" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    'Williams':        <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="20" rx="4" stroke={color} strokeWidth="1.4" fill={`${color}0e`}/><path d="M8 12 L11 24 L14 16 L17 24 L20 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 12 L22 24 M22 12 L27 12 C28.5 12 29 13 29 14.5 C29 16 28.5 17 27 17 L22 17 M22 17 L28 24" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    'Racing Bulls':    <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><path d="M18 26 C13 26 9 22 9 17 C9 12 12 9 16 9 L14 5 C12 3 10 4 9 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M18 26 C23 26 27 22 27 17 C27 12 24 9 20 9 L22 5 C24 3 26 4 27 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><ellipse cx="18" cy="18" rx="6" ry="7" fill={`${color}20`} stroke={color} strokeWidth="1.2"/></svg>,
    'Haas F1 Team':    <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><rect x="5" y="5" width="26" height="26" rx="5" stroke={color} strokeWidth="1.2" fill={`${color}0c`}/><line x1="11" y1="10" x2="11" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round"/><line x1="25" y1="10" x2="25" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round"/><line x1="11" y1="18" x2="25" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></svg>,
    'Audi':            <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><circle cx="10" cy="18" r="6.5" stroke={color} strokeWidth="1.6" fill="none"/><circle cx="18" cy="18" r="6.5" stroke={color} strokeWidth="1.6" fill="none"/><circle cx="26" cy="18" r="6.5" stroke={color} strokeWidth="1.6" fill="none"/></svg>,
    'Cadillac':        <svg width={s} height={s} viewBox="0 0 36 36" fill="none"><rect x="6" y="10" width="24" height="16" rx="2" stroke={color} strokeWidth="1.4" fill={`${color}10`}/><path d="M6 16 L30 16" stroke={color} strokeWidth="1" opacity="0.5"/><path d="M6 20 L30 20" stroke={color} strokeWidth="1" opacity="0.5"/><path d="M12 10 L12 26" stroke={color} strokeWidth="1" opacity="0.5"/><path d="M24 10 L24 26" stroke={color} strokeWidth="1" opacity="0.5"/><rect x="14" y="12" width="8" height="12" fill={`${color}30`}/></svg>,
  }
  return <>{map[name] ?? <span className="font-['Zen_Dots'] text-[9px]" style={{color}}>{name.slice(0,3).toUpperCase()}</span>}</>
}

// ─── TEAM LOGO ─────────────────────────
function TeamLogo({ name, color, size=28, invert=true }: { name:string; color:string; size?:number; invert?:boolean }) {
  const teamId = TEAM_DETAILS[name]?.teamId ?? ''
  const url    = teamId ? getLogoUrl(teamId) : null
  if (url) {
    return (
      <img src={url} alt={name}
        style={{ width:size, height:size, objectFit:'contain', ...(invert ? { filter:'brightness(0) invert(1)', opacity:0.9 } : {}) }}
        onError={e => (e.currentTarget.style.display='none')}
      />
    )
  }
  return <SvgFallback name={name} color={color} size={size}/>
}

// ─── TECHNICAL + DEVELOPMENTS ────────────────────────────────────────────────
// Replace with GET /api/constructors/:teamId/technical and GET /api/constructors/developments
const TECHNICAL = [
  { team:'Red Bull Racing', overall:'98%', metrics:[{label:'Aerodynamics',pct:96},{label:'Power Unit',pct:93},{label:'Reliability',pct:97}] },
  { team:'McLaren',         overall:'94%', metrics:[{label:'Aerodynamics',pct:94},{label:'Power Unit',pct:91},{label:'Reliability',pct:98}] },
  { team:'Ferrari',         overall:'91%', metrics:[{label:'Aerodynamics',pct:92},{label:'Power Unit',pct:95},{label:'Reliability',pct:86}] },
  { team:'Mercedes',        overall:'89%', metrics:[{label:'Aerodynamics',pct:88},{label:'Power Unit',pct:94},{label:'Reliability',pct:95}] },
]
const DEVELOPMENTS = [
  { title:'New Front Wing',  team:'Red Bull', body:'Aero package delivering 0.3s/lap at high-speed corners.',           race:'Monaco GP' },
  { title:'Engine Upgrade',  team:'Mercedes', body:'Phase 2 PU — +14hp and improved thermal efficiency.',               race:'Canada GP' },
  { title:'Floor Update',    team:'Ferrari',  body:'Revised floor edges reducing porpoising at medium-speed circuits.', race:'Spain GP'  },
]

// ─── TEAM CARD ────────────────────────────────────────────────────────────────
function TeamCard({ name, rank, points, wins, eloRating }: {
  name:string; rank:number; points:number; wins:number; eloRating:number
}) {
  const [hovered, setHovered] = useState(false)
  const d = TEAM_DETAILS[name] ?? { color:'#748386', lightColor:'#99a1af', teamId:'', drivers:['—','—'], base:'—', championships:0, engine:'—', principal:'—' }
  const carUrl = getCarUrl(d.teamId)

  return (
    <div
      className="relative rounded-xl overflow-hidden tire-texture cursor-none"
      style={{
        background: `linear-gradient(120deg,${d.color} 0%,${d.lightColor}88 40%,${d.color}cc 100%)`,
        transform:   hovered ? 'translateY(-3px)' : 'none',
        boxShadow:   hovered ? `0 12px 40px ${d.color}55` : `0 4px 16px ${d.color}22`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 diag-stripes-team"/>

      {/* Car background */}
      {carUrl && (
        <img
          src={carUrl}
          alt=""
          className="absolute right-0 bottom-0 h-[75%] object-contain pointer-events-none select-none"
          style={{ opacity: 0.7, maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 40%, transparent 100%)' }}
        />
      )}

      {/* Rank */}
      <div className="absolute top-4 left-4 w-9 h-9 rounded-lg flex items-center justify-center font-['Zen_Dots'] text-base"
        style={{ background:'rgba(0,0,0,0.3)', color:'#F0EBD8', border:'1px solid rgba(240,235,216,0.2)' }}>
        {rank}
      </div>

      {/* Team logo — top right */}
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background:'rgba(0,0,0,0.28)', border:'1.5px solid rgba(240,235,216,0.2)' }}>
        <TeamLogo name={name} color="#F0EBD8" size={30}/>
      </div>

      <div className="relative p-5 pt-14">
        <h3 className="font-['Alumni_Sans'] font-bold text-[28px] leading-tight mb-1"
          style={{ color:'#F0EBD8', textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>
          {name}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          {d.drivers.map(dr => (
            <div key={dr} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full shrink-0"
                style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(240,235,216,0.3)' }}/>
              <span className="font-['Alumni_Sans'] text-[13px]" style={{ color:'rgba(240,235,216,0.85)' }}>
                {dr.split(' ')[0]} <strong>{dr.split(' ').slice(1).join(' ')}</strong>
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 pt-3 border-t" style={{ borderColor:'rgba(240,235,216,0.15)' }}>
          {[
            { label:'Points',        value:points         },
            { label:'Wins',          value:wins           },
            { label:'ELO',           value:eloRating      },
            { label:'Championships', value:d.championships },
          ].map(s => (
            <div key={s.label}>
              <p className="font-['Alumni_Sans_Inline_One'] text-[20px] leading-none" style={{ color:'#F0EBD8', fontSize: '45px'}}>{s.value}</p>
              <p className="font-['Alumni_Sans'] text-[10px] uppercase tracking-wide mt-0.5" style={{ color:'rgba(240,235,216,0.55)' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="font-['Alumni_Sans'] text-[11px]" style={{ color:'rgba(240,235,216,0.45)' }}>🔧 {d.engine}</span>
          <span className="font-['Alumni_Sans'] text-[11px]" style={{ color:'rgba(240,235,216,0.45)' }}>📍 {d.base}</span>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Constructors() {
  const constructors = MOCK_CONSTRUCTORS

  return (
    <div className={PAGE}>

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      <div className={PAGE_HEADER}
        style={{ background:'linear-gradient(105deg,#0c0e10 0%,rgba(124,152,158,0.08) 50%,#0c0e10 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D]"/>
        <div className="relative flex items-end justify-between">
          <div>
            <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] tracking-[3px] uppercase mb-1">2026 Season</p>
            <h1 className="font-['Zen_Dots'] text-[32px] text-white font-normal">Constructor Standings</h1>
          </div>
          <span className="font-['Alumni_Sans'] text-sm text-[#9FA0C3] border border-[rgba(124,152,158,0.3)] rounded-lg py-1.5 px-4">
            🏆 After Monaco GP · Round 7
          </span>
        </div>
      </div>

      <div className={INNER}>
        <SectionDivider variant="sector" label="Constructor Standings" />
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[2px] w-5 bg-[#D82B0D]"/>
            <h2 className={H2}>Teams</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {constructors.map(c => (
              <TeamCard key={c.rank} name={c.name} rank={c.rank}
                points={c.points} wins={c.wins} eloRating={c.eloRating}/>
            ))}
          </div>
        </div>

        <SectionDivider variant="slash" />

        <div className="grid grid-cols-2 gap-4">
          {/* Technical */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[2px] w-5 bg-[#7C989E]"/>
              <h2 className={H2}>Technical Performance</h2>
            </div>
            <div className="flex flex-col gap-3">
              {TECHNICAL.map(t => (
                <div key={t.team} className="rounded-lg p-4 border"
                  style={{ background:`${TEAM_DETAILS[t.team]?.color??'#748386'}0d`, borderColor:`${TEAM_DETAILS[t.team]?.color??'#748386'}33` }}>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TeamLogo name={t.team} color={TEAM_DETAILS[t.team]?.color??'#748386'} size={20} invert={false}/>
                      <span className="font-['Alumni_Sans'] text-[15px] text-white font-semibold">{t.team}</span>
                    </div>
                    <span className="font-['Alumni_Sans'] text-[15px] text-[#22c55e] font-semibold">{t.overall}</span>
                  </div>
                  {t.metrics.map(m => (
                    <div key={m.label} className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className={META}>{m.label}</span>
                        <span className="font-['Alumni_Sans'] text-[13px] text-white">{m.pct}%</span>
                      </div>
                      <div className="bg-white/[0.06] rounded-full h-[5px]">
                        <div className="h-[5px] rounded-full" style={{ width:`${m.pct}%`, background:TEAM_DETAILS[t.team]?.color??'#D82B0D' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className={BORDER}/>
          </div>

          {/* Developments */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[2px] w-5 bg-[#9FA0C3]"/>
              <h2 className={H2}>Recent Developments</h2>
            </div>
            <div className="flex flex-col gap-3">
              {DEVELOPMENTS.map(d => {
                const teamName = Object.keys(TEAM_DETAILS).find(k=>k.includes(d.team))??''
                const teamClr  = TEAM_DETAILS[teamName]?.color??'#748386'
                return (
                  <div key={d.title} className="rounded-lg p-4 border-l-[3px]"
                    style={{ background:'rgba(28,33,36,0.8)', borderLeftColor:teamClr }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <TeamLogo name={teamName} color={teamClr} size={16} invert={false}/>
                        <h3 className="font-['Zen_Dots'] text-[13px] text-white font-normal">{d.title}</h3>
                      </div>
                      <span className="font-['Alumni_Sans'] text-[11px] px-2 py-0.5 rounded ml-3 whitespace-nowrap"
                        style={{ background:`${teamClr}18`, color:teamClr, border:`1px solid ${teamClr}44` }}>
                        {d.team}
                      </span>
                    </div>
                    <p className="font-['Alumni_Sans'] text-[13px] text-[#9FA0C3] mb-2">{d.body}</p>
                    <p className="font-['Alumni_Sans'] text-[11px] text-[#748386]">Introduced: {d.race}</p>
                  </div>
                )
              })}
            </div>
            <div className={BORDER}/>
          </div>
        </div>
      </div>
    </div>
  )
}