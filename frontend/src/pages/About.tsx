import { useEffect, useRef, useState } from 'react'
import DRSSweep from '../components/DRSSweep'
import CountUp from '../components/CountUp'
import { PAGE, INNER, PAGE_HEADER, H1, META, CARD, RED, STEEL, LAVENDER, SLATE } from '../components/layout'

import prestonPhoto from '../assets/team/Preston.jpg'
import miguelPhoto from '../assets/team/Miguel.jpg'
import taylorPhoto from '../assets/team/Taylor.jpg'
import katePhoto from '../assets/team/Kate.jpeg'
import tanmayPhoto from '../assets/team/Tanmay.jpg'
import khangPhoto from '../assets/team/Khang.jpg'
import anirudhPhoto from '../assets/team/Anirudh.jpg'
import davidPhoto from '../assets/team/David.jpg'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FRONTEND_MEMBERS = [
  { id: 'fe1', name: 'Kate Mezger', role: 'UI Designer & Frontend Developer', built: 'UI system, animations, pages & components', photo: katePhoto, initial: '' },
  { id: 'fe2', name: 'Tanmay Bogguram', role: 'Frontend Developer', built: 'Data visualisation & interactive charts', photo: tanmayPhoto, initial: '' },
  { id: 'fe3', name: 'Miguel Mendoza', role: 'Simulation Computational Developer', built: 'Simulation engine & race outcome modeling', photo: miguelPhoto, initial: '' },
]

const BACKEND_MEMBERS = [
  { id: 'be1', name: 'Anirudh Devatha', role: 'Fullstack Developer', built: 'API architecture & data pipelines', photo: anirudhPhoto, initial: '' },
  { id: 'be2', name: 'David Aiyeyemi', role: 'Fullstack Developer', built: 'Gradient-boost models & prediction engine', photo: davidPhoto, initial: '' },
  { id: 'be3', name: 'Preston Crowe', role: 'Fullstack Developer', built: 'Database schema, ELO system & FastF1 ingestion', photo: prestonPhoto, initial: '' },
]

const MENTORS = [
  { id: 'm1', name: 'Taylor Mitchell', role: 'Mentor', photo: taylorPhoto, initial: '' },
  { id: 'm2', name: 'Khang Doan', role: 'Mentor', photo: khangPhoto, initial: '' },
]

const MODEL_METRICS = [
  { label: 'RMSE Performance', num: 1.889, suffix: 's', sub: 'cross validated error across race outcome targets', color: RED, decimals: 3 },
  { label: 'Variables Trained On', num: 42, suffix: '', sub: 'telemetry, weather, tyre, pace, incidents and track features', color: STEEL, decimals: 0 },
  { label: 'Model Trials', num: 320, suffix: '', sub: 'Optuna driven hyperparameter optimization runs', color: LAVENDER, decimals: 0 },
  { label: 'Primary Technique', num: 1, suffix: '', sub: 'XGBoost gradient boosting with time aware validation', color: '#F0EBD8', decimals: 0 },
]

const FORMULYTICS_FEATURES = [
  { title: 'Custom ELO System', desc: 'An ELO algorithm re-engineered for F1: it accounts for teammate differentials, grid penalties, qualifying pace and wet-weather performance weighting — things generic sports ratings ignore entirely.' },
  { title: 'Simulation Engine', desc: 'Race outcomes derived from thousands of stochastic simulations across multiple race parameters. Output is a full probability distribution, not a single-point prediction.' },
  { title: 'ML Prediction Layer', desc: 'Gradient-boosted models trained on 5 seasons of FastF1 telemetry data. Features include sector times, tyre degradation curves and safety car probability.' },
  { title: 'Telemetry Processing', desc: 'A real-time FastF1 ingestion pipeline that normalises multi-session data into comparable performance indices across every circuit and session type.' },
]

const TECH_COLS = [
  {
    label: 'Frontend', color: STEEL,
    items: [
      { name: 'React', desc: 'Component-based UI framework' },
      { name: 'TypeScript', desc: 'Type-safe JavaScript superset' },
      { name: 'Next.JS', desc: 'React framework for app architecture' },
      { name: 'Tailwind CSS', desc: 'Utility-first styling system' },
      { name: 'Vite', desc: 'Fast build tool and dev server' },
      { name: 'Recharts', desc: 'Composable data chart library' },
    ],
  },
  {
    label: 'Backend', color: RED,
    items: [
      { name: 'FastAPI', desc: 'High-performance Python API framework' },
      { name: 'Python', desc: 'Core backend runtime language' },
      { name: 'F1 API', desc: 'Supplementary race and session data source' },
      { name: 'Open Meteo', desc: 'Weather feed for race condition modeling' },
      { name: 'FastF1', desc: 'Official F1 telemetry data ingestion' },
      { name: 'Redis', desc: 'Caching and session storage' },
    ],
  },
  {
    label: 'AI/ML', color: LAVENDER,
    items: [
      { name: 'scikit-learn', desc: 'ML model training and evaluation' },
      { name: 'Gradient Boost', desc: 'Race outcome prediction engine' },
      { name: 'XGBoost', desc: 'Primary gradient boosting implementation' },
      { name: 'Optuna', desc: 'Automated hyperparameter optimization' },
      { name: 'Simulation Engine', desc: 'Multi-parameter stochastic race sims' },
      { name: 'Custom ELO', desc: 'F1-adapted driver rating system' },
    ],
  },
]

const DIFFERENTIATORS = [
  { title: 'Predictions, Not Just Stats', desc: 'Most F1 platforms tell you what happened. TrackSense tells you what will: thousands of stochastic simulations per race weekend with full ML confidence intervals on every outcome.', color: RED },
  { title: 'F1-Native ELO Rating', desc: 'Generic sports ELO breaks in F1. Ours is rebuilt from the ground up; accounting for teammate differentials, grid penalties, qualifying pace and wet-weather conditions.', color: STEEL },
  { title: 'Real Telemetry Pipeline', desc: 'We process raw FastF1 telemetry: sector times, tyre compound laps and DRS zones; not just the race-result summaries the FIA publishes publicly.', color: LAVENDER },
  { title: 'Academic & Open', desc: 'Built at UT Dallas with clean API boundaries and documented integration points: de$$OCF = (Sales - VC - FC) \times (1 - Tax Rate) + (Depreciation \times Tax Rate)$$signed to be extended by the community, not locked behind a paywall.', color: '#F0EBD8' },
  { title: 'ML Based Analytics', desc: 'Predictions and insights are powered by machine learning models trained on telemetry, race, and environmental variables rather than static heuristics.', color: STEEL },
  { title: 'Betting Decision Support', desc: 'Probability driven what-if projections can be used as an informed assistant layer for gambling related decision making; not as guaranteed outcomes.', color: LAVENDER },
]

const IMPACT_STATS = [
  {
    value: 91.8, suffix: '%', label: 'Prediction Accuracy', accent: RED, bg: 'rgba(216,43,13,0.08)', decimals: 1,
    why: 'When every race matters, you need predictions you can actually trust. Our model gives you that — not a gut feeling, a probability.',
  },
  {
    value: 1.2, suffix: 'M', label: 'Data Points Ingested', accent: STEEL, bg: 'rgba(124,152,158,0.08)', decimals: 1,
    why: 'Most F1 apps show you the headline. We built the pipeline that processes what sits behind it — raw telemetry the highlights never show.',
  },
  {
    value: 10, suffix: 'K', label: 'Simulations / Race', accent: LAVENDER, bg: 'rgba(159,160,195,0.08)', decimals: 0,
    why: "We don't predict one future — we simulate thousands of scenarios and surface the most probable one. One number hides the real story.",
  },
  {
    value: 24, suffix: '', label: 'Circuits Tracked', accent: '#F0EBD8', bg: 'rgba(240,235,216,0.06)', decimals: 0,
    why: 'Circuit DNA matters. Monaco will never produce the same race as Monza. We model the personality of all 24 circuits individually.',
  },
]

const FUTURE_PLANS = [
  { title: 'Live Race Feed', desc: 'Real-time lap data and position updates streamed during race weekends, giving you a live analytics view as the race unfolds lap by lap.' },
  { title: 'Strategy Simulator', desc: 'An interactive pit stop and tyre strategy tool: build your own race strategy and see the predicted outcome across thousands of simulated scenarios.' },
  { title: 'Mobile Layout', desc: 'A responsive design pass optimised for tablet and phone; so you can follow the analytics from the grandstands on race day.' },
  { title: 'Open Source Release', desc: 'A public GitHub release with full documentation for the data pipeline and ML model architecture: for the F1 data science community to build on.' },
  { title: 'Added variables for higher model performance', desc: 'Expand the feature set with richer circuit, stint and reliability variables to increase model signal and reduce error.' },
  { title: 'Strategy, weather and potential wreck what-if modelling', desc: 'Simulate what-if race branches by combining pit strategy options, weather shifts and incident probability.' },
  { title: 'Ensemble model architecture', desc: 'Blend different predictive models into an ensemble to improve robustness across varying circuits and race conditions.' },
  { title: 'Qualifying Prediction', desc: 'Qualifying position predictions derived from sector time models and historical circuit performance, giving you a projected grid before a single lap is run.'}
]

// ─── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ photo, initial, size = 72, border = `${STEEL}66`, bg = `${STEEL}1a` }: {
  photo: string | undefined; initial: string; size?: number; border?: string; bg?: string
}) {
  return (
    <div className="relative rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: bg, border: `1.5px solid ${border}` }}>
      {photo && (
        <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      )}
      <span className="font-['Zen_Dots'] text-white select-none relative z-10" style={{ fontSize: size * 0.24 }}>
        {initial}
      </span>
    </div>
  )
}

// ─── SCROLL-REVEAL ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.07 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ label, title, color = RED }: { label: string; title: string; color?: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px w-7 shrink-0" style={{ background: color }} />
        <span className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3.5px]" style={{ color }}>{label}</span>
      </div>
      <h2 className="font-['Zen_Dots'] text-[26px] text-white font-normal leading-snug">{title}</h2>
    </div>
  )
}

// ─── THIN DIVIDER between sections ───────────────────────────────────────────
function Divider() {
  return <div className="my-7 sm:my-8" />
}

// ─── MEMBER CARD ───────────────────────────────────────────────────────────────
function MemberCard({ m, delay = 0 }: { m: { id: string; name: string; role: string; built: string; photo: string | undefined; initial: string }; delay?: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Reveal delay={delay}>
      <div
        className={`${CARD} relative flex flex-col items-center text-center transition-all duration-200 overflow-hidden`}
        style={{ padding: '28px 20px', cursor: 'none' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none"
          style={{ boxShadow: hovered ? `0 0 0 1px ${STEEL}55, 0 8px 32px ${STEEL}14` : 'none' }}
        />
        <div className="w-full h-[2px] rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${STEEL}, transparent)` }} />
        <Avatar photo={m.photo} initial={m.initial} size={92} border={`${STEEL}55`} bg={`${STEEL}1a`} />
        <p className="font-['Alumni_Sans'] text-[26px] text-white font-semibold mt-4 mb-1 leading-tight">{m.name}</p>
        <span
          className="font-['Alumni_Sans'] text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-full mb-3"
          style={{ background: `${STEEL}18`, color: STEEL, border: `1px solid ${STEEL}33` }}
        >
          {m.role}
        </span>
        <p className="font-['Alumni_Sans'] text-[15px] leading-snug" style={{ color: LAVENDER }}>{m.built}</p>
      </div>
    </Reveal>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function About() {
  return (
    <div className={PAGE}>
      <DRSSweep delay={80} />

      <div
        className={PAGE_HEADER}
        style={{
          background: 'linear-gradient(105deg,#0c0e10 0%,rgba(159,160,195,0.06) 50%,#0c0e10 100%)',
        }}
      >
        
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className={META + ' text-[11px] tracking-[3px] uppercase mb-1'} style={{ color: STEEL }}>
              Platform overview
            </p>
            <h1 className={H1}>About TrackSense</h1>
            <p className={META + ' mt-2 text-[15px] '}>
             TrackSense is a Formula 1 analytics platform combining machine learning, real-time telemetry and advanced statistical modelling to provide deep 
             insight into race performance and predictive outcomes. At its core is a custom ELO rating system adapted specifically for F1's unique competitive structure; 
             factoring in teammate comparisons, grid penalties, DNFs and qualifying pace — not just race wins. 
             Alongside it sits a stochastic simulation engine running thousands of race scenarios per weekend.
             Every number on this platform is designed to connect to live backend data. The architecture deliberately separates mock data from API calls; 
             each page has a clearly marked integration point requiring a single line change.
            </p>
          </div>
          <div className="hidden sm:flex items-baseline gap-1 shrink-0 font-['Zen_Dots'] text-[26px]">
            <span className="text-white">TRACK</span>
            <span style={{ color: RED }}>SENSE</span>
          </div>
        </div>
      </div>


      <div className={INNER}>
        
        

        
{/* ══ TEAM AND MENTORSHIP ══════════════════════════════════════════ */}
        <Reveal delay={0.04}>
          <section>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <SectionTitle label="Organisation" title="Team and Mentorship" color={RED} />
              </div>
              <p className="font-['Alumni_Sans'] text-[11px] font-bold uppercase tracking-[0.22em] shrink-0 pt-1" style={{ color: SLATE }}>
                UT Dallas · 2026
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-9">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] flex items-center gap-3" style={{ color: STEEL }}>
                    <span className="inline-block w-5 h-px" style={{ background: STEEL }} />
                    Frontend and simulation
                  </p>
                  <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] flex items-center gap-3" style={{ color: LAVENDER }}>
                    <span className="inline-block w-5 h-px" style={{ background: LAVENDER }} />
                    Mentor
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {FRONTEND_MEMBERS.map((m, i) => <MemberCard key={m.id} m={m} delay={i * 0.07} />)}
                  <MemberCard m={{ ...MENTORS[1], built: 'Mentorship' }} delay={0.21} />
                </div>
              </div>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] flex items-center gap-3" style={{ color: STEEL }}>
                    <span className="inline-block w-5 h-px" style={{ background: STEEL }} />
                    Backend &amp; fullstack
                  </p>
                  <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] flex items-center gap-3" style={{ color: LAVENDER }}>
                    <span className="inline-block w-5 h-px" style={{ background: LAVENDER }} />
                    Mentor
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {BACKEND_MEMBERS.map((m, i) => <MemberCard key={m.id} m={m} delay={i * 0.07} />)}
                  <MemberCard m={{ ...MENTORS[0], built: 'Mentorship' }} delay={0.21} />
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Divider />
        {/* ══ WHY WE BUILT TRACKSENSE ══════════════════════════════════════ */}
        <Reveal>
          <section>
            <SectionTitle label="Our Story" title="Why We Built TrackSense" color={RED} />
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="rounded-2xl border p-7" style={{ borderColor: `${RED}33`, background: 'rgba(216,43,13,0.04)' }}>
                <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] mb-3" style={{ color: RED }}>The Problem</p>
                <p className="font-['Alumni_Sans'] text-[18px] leading-relaxed" style={{ color: LAVENDER }}>
                  Formula 1 generates enormous volumes of data every race weekend: telemetry, sector times and tyre compounds; yet most public platforms only surface simple race results and standings. The deeper analytical story stays buried.
                </p>
              </div>
              <div className="rounded-2xl border p-7" style={{ borderColor: `${STEEL}33`, background: 'rgba(124,152,158,0.05)' }}>
                <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[3px] mb-3" style={{ color: STEEL }}>Our Solution</p>
                <p className="font-['Alumni_Sans'] text-[18px] leading-relaxed" style={{ color: LAVENDER }}>
                  TrackSense brings the full analytical stack: raw telemetry ingestion, a custom F1-adapted ELO rating system, race simulation and gradient-boosted ML predictions; into a single platform for enthusiasts and analysts alike.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        <Divider />

        
        {/* ══ WHY CHOOSE TRACKSENSE ════════════════════════════════════════ */}
        <Reveal delay={0.04}>
          <section>
            <SectionTitle label="Differentiators" title="Why Choose TrackSense" color={RED} />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {DIFFERENTIATORS.map((d, i) => (
                <Reveal key={d.title} delay={i * 0.06} className="h-full">
                  <div className="h-full flex flex-col gap-2 rounded-2xl border p-6" style={{ borderColor: `${d.color}33`, background: 'rgba(15,18,20,0.65)' }}>
                    <p className="font-['Alumni_Sans_Inline_One'] text-[22px] leading-none" style={{ color: d.color }}>
                      0{i + 1}
                    </p>
                    <p className="font-['Zen_Dots'] text-[13px] text-white font-normal">{d.title}</p>
                    <p className="font-['Alumni_Sans'] text-[17px] leading-relaxed flex-1" style={{ color: LAVENDER }}>{d.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        <Divider />

        

        {/* ══ FORMULYTICS ══════════════════════════════════════════════════ */}
        <Reveal delay={0.04}>
          <section>
            <div className="flex items-start justify-between mb-6">
              <SectionTitle label="ML Engine" title="Formulytics" color={RED} />
            </div>
            <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[2.5px] mt-8 mb-4" style={{ color: LAVENDER }}>
              Model Accuracy Metrics
            </p>
            <div className="grid grid-cols-2 gap-8 mb-10 lg:grid-cols-4">
              {MODEL_METRICS.map((m, i) => (
                <Reveal key={m.label} delay={i * 0.07}>
                  <div className="text-left rounded-xl border p-5" style={{ borderColor: `${m.color}33`, background: 'rgba(15,18,20,0.5)' }}>
                    <p className="font-['Alumni_Sans_Inline_One'] text-[36px] leading-none mb-1.5" style={{ color: m.color }}>
                      <CountUp to={m.num} suffix={m.suffix} decimals={m.decimals ?? 1} duration={1400} />
                    </p>
                    <p className="font-['Zen_Dots'] text-[12px] text-white font-normal mb-1">{m.label}</p>
                    <p className="font-['Alumni_Sans'] text-[15px]" style={{ color: LAVENDER }}>{m.sub}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="font-['Alumni_Sans'] text-[13px] font-bold uppercase tracking-[2.5px] mb-4" style={{ color: LAVENDER }}>
              Core Components
            </p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {FORMULYTICS_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.06} className="h-full">
                  <div className="h-full flex flex-col rounded-2xl border p-6" style={{ borderColor: 'rgba(124,152,158,0.25)', background: 'rgba(15,18,20,0.45)' }}>
                    <p className="font-['Zen_Dots'] text-[14px] text-white font-normal mb-2">{f.title}</p>
                    <p className="font-['Alumni_Sans'] text-[17px] leading-relaxed flex-1" style={{ color: LAVENDER }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        <Divider />

        {/* ══ TECHNOLOGY STACK ═════════════════════════════════════════════ */}
        <Reveal delay={0.04}>
          <section>
            <SectionTitle label="Built With" title="Technology Stack" color={STEEL} />
            <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
              {TECH_COLS.map(col => (
                <div key={col.label} className="rounded-2xl border p-6" style={{ borderColor: `${col.color}33`, background: 'rgba(15,18,20,0.45)' }}>
                  <p className="font-['Zen_Dots'] text-[15px] font-normal mb-5" style={{ color: col.color }}>{col.label}</p>
                  <div className="flex flex-col gap-4">
                    {col.items.map(item => (
                      <div key={item.name}>
                        <p className="font-['Alumni_Sans'] text-[16px] text-white font-semibold leading-tight">{item.name}</p>
                        <p className="font-['Alumni_Sans'] text-[15px]" style={{ color: LAVENDER }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Divider />

        {/* ══ WHAT'S NEXT ══════════════════════════════════════════════════ */}
        <Reveal delay={0.04}>
          <section>
            <SectionTitle label="Roadmap" title="What's Next" color={STEEL} />
            <ol className="mt-8 list-decimal list-inside grid grid-cols-1 gap-6 sm:grid-cols-2 marker:text-[#748386] marker:font-bold">
              {FUTURE_PLANS.map((f) => (
                <li key={f.title} className="font-['Alumni_Sans'] text-[17px] leading-relaxed rounded-xl border p-5" style={{ color: LAVENDER, borderColor: 'rgba(124,152,158,0.22)', background: 'rgba(15,18,20,0.4)' }}>
                  <span className="font-['Alumni_Sans'] text-white font-semibold">{f.title}. </span>
                  {f.desc}
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="border-t border-[rgba(124,152,158,0.18)] pt-6 text-center">
          <p className="font-['Alumni_Sans'] text-[16px]" style={{ color: LAVENDER }}>TrackSense © 2026 · Advanced F1 Analytics Platform</p>
          <p className="font-['Alumni_Sans'] text-[14px] mt-1" style={{ color: '#748386' }}>Built for Formula 1 enthusiasts, analysts and data scientists</p>
        </div>

      </div>
    </div>
  )
}
