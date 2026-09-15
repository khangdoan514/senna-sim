/**
 * SIDEBAR — steel/slate palette with red accent on active items.
 * Hover-expands from 90px → 248px (overlay).
 *
 * Nav structure:
 *   Home
 *   Weekend  → Simulation · ELO · Performance
 *   Telemetry → Stats · Formulytics (ML Model)
 *   Explore  → Drivers · Constructors · Circuits
 *   About
 */

import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import {
  Home, Info, CalendarDays, Activity,
  Play, TrendingUp, BarChart2,
  Signal, Cpu, Compass,
  User, Trophy, Map, ChevronRight,
} from 'lucide-react'

interface NavItem  { path: string; icon: React.ElementType; label: string }
interface NavGroup { id: string;  icon: React.ElementType; label: string; items: NavItem[] }
type NavEntry = { kind: 'item'; data: NavItem } | { kind: 'group'; data: NavGroup }

const NAV: NavEntry[] = [
  { kind: 'item',  data: { path: '/',              icon: Home,        label: 'Home' } },
  { kind: 'group', data: { id: 'weekend',           icon: CalendarDays, label: 'Weekend', items: [
    { path: '/simulation',   icon: Play,        label: 'Simulation'   },
    { path: '/elo',          icon: TrendingUp,  label: 'ELO Rating'   },
    { path: '/performance',  icon: BarChart2,   label: 'Performance'  },
  ] } },
  { kind: 'group', data: { id: 'telemetry',         icon: Activity,    label: 'Telemetry', items: [
    { path: '/telemetry',    icon: Signal,      label: 'Stats'        },
    { path: '/formulytics',  icon: Cpu,         label: 'Formulytics'  },
  ] } },
  { kind: 'group', data: { id: 'explore',           icon: Compass,     label: 'Explore',   items: [
    { path: '/drivers',      icon: User,        label: 'Drivers'      },
    { path: '/constructors', icon: Trophy,      label: 'Constructors' },
    { path: '/circuits',     icon: Map,         label: 'Circuits'     },
  ] } },
  { kind: 'item',  data: { path: '/about',          icon: Info,        label: 'About' } },
]

const W_COL = 90, W_EXP = 248, ROW_H = 44, SUB_H = 38

export default function Sidebar() {
  const location = useLocation()
  const [expanded,    setExpanded]   = useState(false)
  const [openGroups,  setOpenGroups] = useState<Set<string>>(new Set())
  const [hoveredKey,  setHoveredKey] = useState<string | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive      = (p: string) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  const isGroupActive = (g: NavGroup) => g.items.some(i => isActive(i.path))
  const toggleGroup   = (id: string) => setOpenGroups(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  useEffect(() => {
    NAV.forEach(e => { if (e.kind === 'group' && isGroupActive(e.data)) setOpenGroups(p => new Set([...p, e.data.id])) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const onEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setExpanded(true) }
  const onLeave = () => { leaveTimer.current = setTimeout(() => setExpanded(false), 140) }

  const underlineStyle = (key: string): React.CSSProperties => ({
    borderBottom:    hoveredKey === key ? '1px solid rgba(216,43,13,0.45)' : '1px solid transparent',
    paddingBottom:   '1px',
    transition:      'border-color 0.15s ease',
  })

  const labelStyle = (delay = 0): React.CSSProperties => ({
    opacity:       expanded ? 1 : 0,
    transform:     expanded ? 'translateX(0)' : 'translateX(-8px)',
    transition:    `opacity 0.2s ease ${delay}s, transform 0.2s ease ${delay}s`,
    pointerEvents: expanded ? 'auto' : 'none',
    overflow:      'hidden',
    whiteSpace:    'nowrap',
  })

  return (
    <aside
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position:    'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
        width:        expanded ? W_EXP : W_COL,
        transition:  'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        background:  'linear-gradient(180deg,#0c0f11 0%,#090b0d 60%,#070809 100%)',
        borderRight: '1px solid rgba(124,152,158,0.18)',
        boxShadow:    expanded
          ? '6px 0 40px rgba(0,0,0,0.8), 1px 0 0 rgba(124,152,158,0.08)'
          : '2px 0 12px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 20, paddingBottom: 20, overflow: 'hidden',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', paddingLeft:20, paddingRight:12, marginBottom:22, minHeight:48 }}>
        <div style={{ width:46, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            {/* S1 — Red sector  (230° → 340°) */}
            <path d="M 7.61 6.19 A 11.5 11.5 0 0 1 25.81 11.07"
              stroke="#D82B0D" strokeWidth="2.5" strokeLinecap="round"/>
            {/* S2 — Teal sector (350° → 100°, passes through 0°) */}
            <path d="M 26.33 13.0 A 11.5 11.5 0 0 1 13.0 26.33"
              stroke="#7C989E" strokeWidth="2.5" strokeLinecap="round" opacity="0.75"/>
            {/* S3 — Lavender sector (110° → 220°) */}
            <path d="M 11.07 25.81 A 11.5 11.5 0 0 1 6.19 7.61"
              stroke="#9FA0C3" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            {/* Needle + pivot — revs up when sidebar expands */}
            <g style={{ transformOrigin:'15px 15px', transform: expanded ? 'rotate(22deg)' : 'rotate(0deg)', transition:'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <line x1="15" y1="15" x2="23.5" y2="8.5"
                stroke="#D82B0D" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M15 13 L16.5 15 L15 17 L13.5 15 Z" fill="#D82B0D"/>
            </g>
          </svg>
        </div>
        <div style={{ ...labelStyle(0.05), marginLeft:8 }}>
          <div style={{ fontFamily:"'Zen Dots',sans-serif", fontSize:14, color:'#fff', letterSpacing:'0.5px', lineHeight:1.1 }}>
            TRACK<span style={{ color:'#D82B0D' }}>SENSE</span>
          </div>
          <div style={{ fontFamily:"'Alumni Sans',sans-serif", fontSize:10, color:'rgba(124,152,158,0.55)', letterSpacing:'2.5px', textTransform:'uppercase', marginTop:3 }}>
            F1 Analytics
          </div>
        </div>
      </div>

      {/* ── Separator ─────────────────────────────────────────────────────── */}
      <div style={{ margin:'0 16px 14px', height:1, background:'linear-gradient(90deg,rgba(124,152,158,0.35) 0%,rgba(124,152,158,0.05) 100%)' }}/>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ display:'flex', flexDirection:'column', gap:2, padding:'0 10px', flex:1 }}>
        {NAV.map((entry, entryIdx) => {

          if (entry.kind === 'item') {
            const { path, icon: Icon, label } = entry.data
            const active = isActive(path)
            return (
              <NavLink key={path} to={path} end={path === '/'} title={expanded ? undefined : label}
                onMouseEnter={() => setHoveredKey(path)}
                onMouseLeave={() => setHoveredKey(null)}
                style={({ isActive: ia }) => ({
                  display:'flex', alignItems:'center', height:ROW_H, paddingLeft:10, paddingRight:10,
                  borderRadius:10, textDecoration:'none', position:'relative',
                  background: ia ? 'rgba(216,43,13,0.14)' : 'transparent',
                  color:       ia ? '#F0EBD8' : 'rgba(159,160,195,0.5)',
                  transition: 'background 0.15s,color 0.15s',
                })}
              >
                {active && (
                  <div style={{ position:'absolute', left:-10, top:'50%', transform:'translateY(-50%)',
                    width:3, height:22, borderRadius:'0 3px 3px 0', background:'#D82B0D', boxShadow:'0 0 8px #D82B0D' }}/>
                )}
                <span style={{ width:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.6} color={active ? '#D82B0D' : 'currentColor'}/>
                </span>
                <span style={{ ...labelStyle(entryIdx * 0.015 + 0.04), fontFamily:"'Alumni Sans',sans-serif", fontSize:14, fontWeight:600, letterSpacing:'0.15px' }}>
                  <span style={underlineStyle(path)}>{label}</span>
                </span>
              </NavLink>
            )
          }

          const group  = entry.data as NavGroup
          const Icon   = group.icon
          const gActive = isGroupActive(group)
          const isOpen  = openGroups.has(group.id)

          return (
            <div key={group.id}>
              <button
                onClick={() => { if (expanded) toggleGroup(group.id) }}
                onMouseEnter={() => setHoveredKey(group.id)}
                onMouseLeave={() => setHoveredKey(null)}
                title={expanded ? undefined : group.label}
                style={{
                  display:'flex', alignItems:'center', width:'100%', height:ROW_H,
                  paddingLeft:10, paddingRight:10, borderRadius:10, border:'none', cursor:'none',
                  background: gActive && !isOpen ? 'rgba(216,43,13,0.1)' : isOpen ? 'rgba(124,152,158,0.06)' : 'transparent',
                  color:      gActive ? 'rgba(240,235,216,0.9)' : 'rgba(159,160,195,0.5)',
                  transition: 'background 0.15s,color 0.15s', position:'relative',
                }}
              >
                {gActive && !isOpen && (
                  <div style={{ position:'absolute', left:-10, top:'50%', transform:'translateY(-50%)',
                    width:3, height:22, borderRadius:'0 3px 3px 0', background:'#D82B0D', boxShadow:'0 0 8px #D82B0D' }}/>
                )}
                <span style={{ width:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={20} strokeWidth={gActive ? 2.2 : 1.6} color={gActive ? '#D82B0D' : 'currentColor'}/>
                </span>
                <span style={{ ...labelStyle(entryIdx * 0.015 + 0.04), display:'flex', alignItems:'center', justifyContent:'space-between', flex:1 }}>
                  <span style={{ fontFamily:"'Alumni Sans',sans-serif", fontSize:14, fontWeight:600, letterSpacing:'0.15px', ...underlineStyle(group.id) }}>{group.label}</span>
                  <ChevronRight size={13} strokeWidth={2} style={{ color:'rgba(124,152,158,0.4)', marginRight:6, flexShrink:0, transform:isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.22s ease' }}/>
                </span>
              </button>

              {/* Sub-items */}
              <div style={{ maxHeight:isOpen && expanded ? group.items.length * (SUB_H + 3) + 8 : 0, opacity:isOpen && expanded ? 1 : 0, overflow:'hidden', transition:'max-height 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.22s ease' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'4px 0 4px 44px' }}>
                  {group.items.map((item, subIdx) => {
                    const SubIcon   = item.icon
                    const subActive = isActive(item.path)
                    return (
                      <NavLink key={item.path} to={item.path}
                        onMouseEnter={() => setHoveredKey(item.path)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{
                          display:'flex', alignItems:'center', gap:8, height:SUB_H,
                          padding:'0 10px 0 10px', borderRadius:7, textDecoration:'none',
                          background:  subActive ? 'rgba(216,43,13,0.12)' : 'transparent',
                          color:       subActive ? '#F0EBD8' : 'rgba(159,160,195,0.45)',
                          borderLeft:  subActive ? '2px solid rgba(216,43,13,0.5)' : '2px solid rgba(124,152,158,0.15)',
                          transition:  `all 0.15s ease, opacity 0.18s ease ${subIdx * 0.04 + 0.05}s, transform 0.18s ease ${subIdx * 0.04 + 0.05}s`,
                          opacity:     isOpen && expanded ? 1 : 0,
                          transform:   isOpen && expanded ? 'translateX(0)' : 'translateX(-6px)',
                        }}
                      >
                        <SubIcon size={14} strokeWidth={subActive ? 2.2 : 1.6} color={subActive ? '#D82B0D' : 'currentColor'}/>
                        <span style={{ fontFamily:"'Alumni Sans',sans-serif", fontSize:13, fontWeight:600, whiteSpace:'nowrap', letterSpacing:'0.1px', ...underlineStyle(item.path) }}>
                          {item.label}
                        </span>
                        {subActive && (
                          <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#D82B0D', boxShadow:'0 0 6px #D82B0D', flexShrink:0 }}/>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 14px', marginTop:12 }}>
        <div style={{ height:1, background:'linear-gradient(90deg,rgba(124,152,158,0.25) 0%,transparent 100%)', marginBottom:14 }}/>
        <div style={{ ...labelStyle(0), display:'flex', alignItems:'center', gap:8, paddingLeft:8, opacity:expanded ? 0.5 : 0 }}>
          {/* Live dot with ping pulse */}
          <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(34,197,94,0.5)', animation:'live-ping 2s ease-out infinite' }}/>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 7px #22c55e' }}/>
          </div>
          <span style={{ fontFamily:"'Alumni Sans',sans-serif", fontSize:10, color:'#9FA0C3', whiteSpace:'nowrap', letterSpacing:'2px', textTransform:'uppercase' }}>
            Live · 2026 Season
          </span>
        </div>
      </div>

      <style>{`
        @keyframes live-ping {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>
    </aside>
  )
}