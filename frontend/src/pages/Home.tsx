/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOME — src/pages/Home.tsx
 * Route: /
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Landing page and entry point for the platform. Introduces TrackSense,
 * highlights the three core capabilities, and links visitors into the deeper
 * analysis sections via the quick-links strip and CTA buttons.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Hero           — fullscreen video + animated TRACK/SENSE title + CTAs
 *  • ScrollVelocity — ticker strip separating hero from content
 *  • Quick Links    — 4-button row jumping to Schedule, Standings, Sim, ELO
 *  • Feature Cards  — three animated cards (Precision Analytics, Telemetry, History)
 *  • About Strip    — brief platform summary with "Learn More" link to /about
 *  • Platform Capabilities — 6-card grid of key features with scroll-reveal
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  This page is purely presentational — no dynamic data yet. When live:
 *
 *  GET /api/season/current                 → current season year + round number
 *    Replace: hardcoded "2026 Season" text in the ScrollVelocity strip / sidebar
 *
 *  GET /api/schedule/next                  → next race name + date
 *    Use for: the "2026 SCHEDULE" quick-link badge or a live countdown
 *
 * ─── ASSETS ──────────────────────────────────────────────────────────────────
 *  src/assets/f1-hero.mp4  — hero background video (placeholder, replace with
 *                            licensed F1 footage or a purpose-shot track clip)
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { INNER, H2, H3, META } from '../components/layout'
import heroVideo from '../assets/f1-hero.mp4'
import ScrollVelocity        from '../components/ScrollVelocity'
import SpeedLines            from '../components/SpeedLines'
import DRSSweep              from '../components/DRSSweep'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '⊙', title: 'Precision Analytics',
    desc: 'ML algorithms predict race outcomes with industry-leading accuracy.',
    accent: '#D82B0D', bg: 'rgba(216,43,13,0.1)', border: 'rgba(216,43,13,0.3)',
  },
  {
    icon: '◈', title: 'Real-Time Telemetry',
    desc: 'Live data integration with instant updates from every race session worldwide.',
    accent: '#7C989E', bg: 'rgba(124,152,158,0.1)', border: 'rgba(124,152,158,0.3)',
  },
  {
    icon: '◫', title: 'Historical Depth',
    desc: 'Comprehensive database spanning the entire modern Formula 1 era.',
    accent: '#9FA0C3', bg: 'rgba(159,160,195,0.1)', border: 'rgba(159,160,195,0.3)',
  },
]

const KEY_FEATURES = [
  { title: 'Custom ELO Rating System',  desc: "Adapted for F1's unique grid dynamics and teammate comparisons",  icon: 'fa-solid fa-chart-column' },
  { title: 'Race Simulation Engine',    desc: '10,000 runs per race weekend',                        icon: 'fa-solid fa-dice'         },
  { title: 'Telemetry Analysis',        desc: 'Sector-by-sector car performance breakdown',                      icon: 'fa-solid fa-signal-bars'  },
  { title: 'Circuit Database',          desc: 'Detailed maps, sector profiles and apex speeds for 24 circuits',  icon: 'fa-solid fa-map'          },
  { title: 'Driver & Team Profiles',    desc: 'Career stats, error analysis and wet-weather skill ratings',      icon: 'fa-solid fa-gauge-max'    },
  { title: 'Prediction Error Margins',  desc: 'Confidence intervals for every lap time and race outcome',        icon: 'fa-solid fa-bullseye-arrow'},
]

const QUICKLINKS = [
  { label: '2026 SCHEDULE',   icon: 'fa-sharp fa-solid fa-calendar',     path: '/circuits'   },
  { label: 'STANDINGS',       icon: 'fa-sharp fa-solid fa-trophy',       path: '/elo'        },
  { label: 'RACE SIMULATION', icon: 'fa-sharp fa-solid fa-play',         path: '/simulation' },
  { label: 'LATEST ELO',      icon: 'fa-sharp fa-solid fa-chart-column', path: '/elo'        },
]

// ─── ANIMATED SECTION HEADER ─────────────────────────────────────────────────
function AnimatedH2({
  children,
  delay = 0,
}: { children: React.ReactNode; delay?: number }) {
  const ref        = useRef<HTMLDivElement>(null)
  const [vis, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex items-center gap-3">
      <div style={{
        height:          2,
        width:           vis ? 24 : 0,
        background:      '#D82B0D',
        borderRadius:    2,
        transition:      `width 0.32s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        boxShadow:       vis ? '0 0 8px #D82B0D' : 'none',
        flexShrink:      0,
      }} />
      <span
        className={H2}
        style={{
          opacity:    vis ? 1 : 0,
          transform:  vis ? 'translateX(0)' : 'translateX(-10px)',
          transition: `opacity 0.3s ease ${delay + 0.14}s, transform 0.3s ease ${delay + 0.14}s`,
        }}
      >
        {children}
      </span>
    </div>
  )
}

// ─── ANIMATED FEATURE CARD ───────────────────────────────────────────────────
function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const ref        = useRef<HTMLDivElement>(null)
  const [vis, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative rounded-xl p-6 overflow-hidden transition-all duration-150 hover:-translate-y-1 hover:brightness-110"
      style={{
        background:      `linear-gradient(135deg, ${f.bg} 0%, rgba(22,26,29,0.95) 100%)`,
        border:          `1px solid ${f.border}`,
        opacity:          vis ? 1 : 0,
        transform:        vis ? 'translateY(0)' : 'translateY(18px)',
        transition:       `opacity 0.4s ease ${i * 0.1 + 0.1}s, transform 0.4s ease ${i * 0.1 + 0.1}s`,
      }}
    >
      {/* ── Animated top bar ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{
          background:      f.accent,
          transformOrigin: 'left center',
          transform:        vis ? 'scaleX(1)' : 'scaleX(0)',
          transition:       `transform 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 0.1 + 0.18}s`,
          boxShadow:        vis ? `0 0 10px ${f.accent}66` : 'none',
        }}
      />

      <div className="relative">
        <span className="text-2xl mb-3 block" style={{ color: f.accent }}>{f.icon}</span>
        <h3 className={`${H3} mb-2`}>{f.title}</h3>
        <p className={META}>{f.desc}</p>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="ml-[90px] bg-[#080a0b]">

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative h-screen overflow-hidden bg-[#060809]">
        <video autoPlay muted loop playsInline disablePictureInPicture
          x-webkit-airplay="deny" controlsList="nodownload nofullscreen noremoteplayback"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40">
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(6,8,9,0.25) 55%, rgba(6,8,9,0.75) 100%)',
        }} />

        <SpeedLines color="#D82B0D" count={22} opacity={0.07} speed={0.8} />


        {/* Badge */}
        <div className="absolute top-10 left-[120px] flex items-center gap-3 animate-slide-down delay-100">
          <div className="h-[2px] w-8 bg-[#D82B0D]" />
          <p className="font-['Alumni_Sans'] font-bold text-[13px] text-[#9FA0C3] tracking-[4px] uppercase">
            Advanced Analytics Platform
          </p>
        </div>

        {/* Hero title & CTAs */}
        <div className="absolute bottom-[80px] right-[60px] text-right animate-slide-left delay-200">
          <div className="flex items-baseline gap-0 mb-3 justify-end">
            <span className="font-['Zen_Dots'] text-[76px] leading-none text-white tracking-[-3px] animate-flash-red delay-300">TRACK</span>
            <span className="font-['Zen_Dots'] text-[76px] leading-none text-[#D82B0D] tracking-[-3px] animate-flash-red delay-400">SENSE</span>
          </div>

          <p className="font-['Alumni_Sans'] text-[18px] text-[#9FA0C3] uppercase tracking-[3px] mb-5 animate-slide-left delay-400">
            ML Predictive Modelling · Formula 1 Simulation
          </p>

          <div className="flex gap-3 justify-end animate-slide-up delay-500">
            <Link to="/simulation"
              className="font-['Zen_Dots'] text-[12px] text-white px-5 py-2.5 rounded-lg transition-all duration-150 hover:brightness-110 hover:scale-105"
              style={{ background: '#D82B0D', border: '1px solid rgba(216,43,13,0.6)', textDecoration: 'none' }}>
              ▶ Start Simulation
            </Link>
            <Link to="/elo"
              className="font-['Zen_Dots'] text-[12px] px-5 py-2.5 rounded-lg transition-all duration-150 hover:scale-105"
              style={{ background: 'rgba(124,152,158,0.12)', border: '1px solid rgba(124,152,158,0.35)', color: '#7C989E', textDecoration: 'none' }}>
              ELO Rankings →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SCROLL VELOCITY STRIP ────────────────────────────────────────── */}
      <ScrollVelocity
        baseSpeed={0.18}
        scrollStrength={3}
        style={{ borderTop: '2px solid #D82B0D', borderBottom: '1px solid rgba(124,152,158,0.2)', background: '#0c0e10' }}
        textStyle={{ color: 'rgba(240,235,216,0.25)' }}
      />

      {/* ── QUICK LINKS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-0 border-b border-[rgba(124,152,158,0.15)]">
        {QUICKLINKS.map((q, i) => (
          <Link
            key={q.label}
            to={q.path}
            className="flex items-center justify-between px-6 py-4 font-['Alumni_Sans'] text-sm font-bold tracking-[1.5px] uppercase transition-all duration-150 hover:scale-[1.02] animate-slide-up"
            style={{
              background:     'rgba(22,26,29,0.8)',
              color:          '#9FA0C3',
              borderRight:    i < 3 ? '1px solid rgba(124,152,158,0.12)' : 'none',
              textDecoration: 'none',
              animationDelay: `${i * 75 + 100}ms`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(216,43,13,0.1)'
              ;(e.currentTarget as HTMLElement).style.color     = '#F0EBD8'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(22,26,29,0.8)'
              ;(e.currentTarget as HTMLElement).style.color     = '#9FA0C3'
            }}
          >
            <div className="flex items-center gap-3">
              <i className={q.icon} style={{ fontSize: 18 }} />
              <span>{q.label}</span>
            </div>
            <span className="text-[10px] opacity-50">↗</span>
          </Link>
        ))}
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div className={INNER}>

        {/* ── FEATURE CARDS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </div>

        {/* ── ABOUT STRIP ───────────────────────────────────────────────── */}
        <div
          className="relative rounded-xl overflow-hidden p-8 flex items-center gap-8 animate-slide-right"
          style={{
            background: 'linear-gradient(105deg,#1c2124 0%,rgba(124,152,158,0.15) 60%,#1c2124 100%)',
            border:     '1px solid rgba(124,152,158,0.25)',
          }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D] rounded-l-xl" />

          <div className="relative flex-1">
            <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] tracking-[3px] uppercase mb-1">
              About TrackSense
            </p>
            <h2 className="font-['Zen_Dots'] text-2xl text-white font-normal mb-2">
              Where Data Meets the Track
            </h2>
            <p className="font-['Alumni_Sans'] text-[14px] text-[#9FA0C3] leading-relaxed max-w-2xl">
              TrackSense combines machine learning, real-time telemetry and advanced statistical modelling
              to provide deep insight into race performance and predictive outcomes. A custom F1-adapted ELO
              system and simulation engine running 10,000 scenarios per race weekend.
            </p>
          </div>

          <div className="relative shrink-0 text-right">
            <p className="font-['Zen_Dots'] text-[48px] leading-none text-[#D82B0D] opacity-20">F1</p>
            <Link to="/about"
              className="font-['Alumni_Sans'] text-sm font-bold tracking-[1px] uppercase px-4 py-2 rounded-lg inline-block mt-2 transition-all duration-150 hover:scale-105"
              style={{ background: 'rgba(124,152,158,0.15)', border: '1px solid rgba(124,152,158,0.35)', color: '#7C989E', textDecoration: 'none' }}>
              Learn More →
            </Link>
          </div>
        </div>

        {/* ── KEY FEATURES ──────────────────────────────────────────────── */}
        <div className="relative bg-[#0e1113] rounded-xl p-6 border border-[rgba(124,152,158,0.12)] animate-slide-up delay-200">
          <div className="absolute inset-0 dot-grid opacity-10 rounded-xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <AnimatedH2>Platform Capabilities</AnimatedH2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {KEY_FEATURES.map((f, i) => (
                <KeyFeatureCard key={f.title} f={f} i={i} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── KEY FEATURE CARD with scroll trigger ────────────────────────────────────
function KeyFeatureCard({ f, i }: { f: typeof KEY_FEATURES[0]; i: number }) {
  const ref        = useRef<HTMLDivElement>(null)
  const [vis, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const accent = i % 3 === 0 ? '#D82B0D' : i % 3 === 1 ? '#7C989E' : '#9FA0C3'

  return (
    <div
      ref={ref}
      className="rounded-lg p-4 transition-all duration-150 hover:scale-[1.03] hover:brightness-110 cursor-none"
      style={{
        background:  i % 3 === 0 ? 'rgba(216,43,13,0.06)' : i % 3 === 1 ? 'rgba(124,152,158,0.06)' : 'rgba(159,160,195,0.06)',
        border:      i % 3 === 0 ? '1px solid rgba(216,43,13,0.2)' : i % 3 === 1 ? '1px solid rgba(124,152,158,0.2)' : '1px solid rgba(159,160,195,0.2)',
        opacity:     vis ? 1 : 0,
        transform:   vis ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition:  `opacity 0.35s ease ${i * 0.07 + 0.1}s, transform 0.35s ease ${i * 0.07 + 0.1}s`,
      }}
    >
      {/* Animated left accent bar */}
      <div style={{
        position:        'absolute',
        left:            0, top: '20%', bottom: '20%',
        width:           2,
        background:      accent,
        borderRadius:    2,
        transform:        vis ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'top',
        transition:       `transform 0.3s ease ${i * 0.07 + 0.22}s`,
        boxShadow:        vis ? `0 0 6px ${accent}55` : 'none',
      }} />

      <div className="flex items-start gap-3">
        <i className={`${f.icon} shrink-0 mt-0.5 opacity-80`} style={{ fontSize: 20 }} />
        <div>
          <h4 className="font-['Zen_Dots'] text-[11px] text-white font-normal mb-1">{f.title}</h4>
          <p className="font-['Alumni_Sans'] text-[12px] text-[#9FA0C3]">{f.desc}</p>
        </div>
      </div>
    </div>
  )
}