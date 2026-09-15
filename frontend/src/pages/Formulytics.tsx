/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMULYTICS — src/pages/Formulytics.tsx
 * Route: /formulytics   (under Telemetry → Formulytics in sidebar)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ML model performance dashboard. Exposes the internals of the TrackSense
 * prediction engine — what it predicts, how accurately, which features it
 * relies on, where it struggles, and how the custom ELO weighting works.
 * Intended audience: technically-minded users and the team itself.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Accuracy overview    — 6 accuracy tiles (race winner, podium, points,
 *                           DNF, qualifying P1, fastest lap) with % + YoY delta
 *  • Feature Importance   — horizontal bar chart of the top 10 model features,
 *                           color-coded by category (pace / elo / tyre / conditions)
 *  • Circuit Breakdown    — 8-circuit table showing per-circuit accuracy and
 *                           average prediction error in seconds + difficulty label
 *  • ELO System Weights   — factor weight breakdown with descriptions, showing
 *                           how the custom ELO formula is composed
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/formulytics/accuracy
 *    → { label, pct, delta, color }[]  (one entry per prediction category)
 *    Replace: ACCURACY_OVERALL constant below
 *
 *  GET /api/formulytics/features
 *    → { feature, importance, category }[]  (sorted descending by importance)
 *    Replace: FEATURE_IMPORTANCE constant below
 *    Note: `importance` is 0–100 (percentage of max); `category` drives bar color
 *
 *  GET /api/formulytics/circuit-breakdown?season=2026
 *    → { circuit, accuracy, error, difficulty }[]
 *    Replace: CIRCUIT_BREAKDOWN constant below
 *    Note: `error` is the mean absolute prediction error in seconds (e.g. '+0.34s')
 *
 *  GET /api/formulytics/elo-weights
 *    → { factor, weight, desc }[]  (weights must sum to 1.0)
 *    Replace: ELO_WEIGHTS constant below
 *    This endpoint is relatively static — only changes when the model is retrained
 *
 * ─── MOCK DATA TO REPLACE ────────────────────────────────────────────────────
 *  ACCURACY_OVERALL   — 6 prediction accuracy entries
 *  FEATURE_IMPORTANCE — top 10 model features with importance scores
 *  CIRCUIT_BREAKDOWN  — 8-circuit accuracy/error table
 *  ELO_WEIGHTS        — 6 ELO factor weights (must total 1.0)
 */

import { PAGE, INNER, PANEL, BORDER, H1, H2, SUB_CARD, PAGE_HEADER } from '../components/layout'
import DRSSweep from '../components/DRSSweep'
import SectionDivider from '../components/SectionDivider'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const ACCURACY_OVERALL = [
  { label: 'Race Winner',        pct: 91.8, delta: '+2.1% vs last season', color: '#D82B0D' },
  { label: 'Podium (Top 3)',     pct: 87.3, delta: '+1.8% vs last season', color: '#7C989E' },
  { label: 'Points Finish',      pct: 93.4, delta: '+0.9% vs last season', color: '#9FA0C3' },
  { label: 'DNF Prediction',     pct: 76.4, delta: '−0.4% vs last season', color: '#F0EBD8' },
  { label: 'Qualifying P1',      pct: 89.1, delta: '+3.2% vs last season', color: '#22c55e' },
  { label: 'Fastest Lap',        pct: 72.6, delta: '+1.1% vs last season', color: '#f59e0b' },
]

const FEATURE_IMPORTANCE = [
  { feature: 'Qualifying Pace (sector composite)',  importance: 94, category: 'pace' },
  { feature: 'ELO Rating (current season)',          importance: 88, category: 'elo' },
  { feature: 'Tyre Degradation Rate',               importance: 81, category: 'tyre' },
  { feature: 'Wet Weather Skill Index',             importance: 76, category: 'conditions' },
  { feature: 'Teammate Delta (season avg)',          importance: 74, category: 'elo' },
  { feature: 'Start Reaction Time',                 importance: 68, category: 'pace' },
  { feature: 'Safety Car Probability',              importance: 61, category: 'conditions' },
  { feature: 'Grid Penalty History',                importance: 55, category: 'elo' },
  { feature: 'Circuit Type Preference',             importance: 52, category: 'pace' },
  { feature: 'DNF Rate (trailing 3 seasons)',       importance: 48, category: 'reliability' },
]

const CIRCUIT_BREAKDOWN = [
  { circuit: 'Monaco',      accuracy: 88.4, error: '+0.34s', difficulty: 'Hard'   },
  { circuit: 'Silverstone', accuracy: 93.1, error: '+0.18s', difficulty: 'Medium' },
  { circuit: 'Monza',       accuracy: 91.7, error: '+0.22s', difficulty: 'Medium' },
  { circuit: 'Spa',         accuracy: 82.3, error: '+0.51s', difficulty: 'Hard'   },
  { circuit: 'Suzuka',      accuracy: 94.2, error: '+0.14s', difficulty: 'Low'    },
  { circuit: 'Singapore',   accuracy: 85.6, error: '+0.43s', difficulty: 'Hard'   },
  { circuit: 'Abu Dhabi',   accuracy: 95.1, error: '+0.11s', difficulty: 'Low'    },
  { circuit: 'Austin',      accuracy: 90.8, error: '+0.25s', difficulty: 'Medium' },
]

const ELO_WEIGHTS = [
  { factor: 'Race Finish Position',    weight: 0.35, desc: 'Strongest single signal'             },
  { factor: 'Qualifying vs Expected',  weight: 0.22, desc: 'Pure pace indicator'                 },
  { factor: 'Teammate Differential',   weight: 0.18, desc: 'Normalises car advantage'            },
  { factor: 'DNF Penalty',             weight: 0.12, desc: 'Partial credit for non-fault DNFs'   },
  { factor: 'Wet Race Multiplier',     weight: 0.08, desc: '1.4× sensitivity in wet conditions'  },
  { factor: 'Grid Penalty Adjustment', weight: 0.05, desc: 'Compensates for penalties applied'   },
]

const CATEGORY_COLORS: Record<string, string> = {
  pace:        '#D82B0D',
  elo:         '#7C989E',
  tyre:        '#f59e0b',
  conditions:  '#9FA0C3',
  reliability: '#ef4444',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Hard:   '#ef4444',
  Medium: '#f59e0b',
  Low:    '#22c55e',
}

// ─── ACCURACY BAR ─────────────────────────────────────────────────────────────
function AccuracyBar({ label, pct, delta, color }: { label: string; pct: number; delta: string; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-['Alumni_Sans'] text-[14px] text-white font-semibold">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-['Alumni_Sans'] text-[11px]" style={{ color: delta.startsWith('+') ? '#22c55e' : '#ef4444' }}>{delta}</span>
          <span className="font-['Zen_Dots'] text-[14px]" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="bg-[rgba(124,152,158,0.08)] rounded-full h-2 relative overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Formulytics() {
  return (
    <div className={PAGE}>

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      {/* Header strip */}
      <div
        className={PAGE_HEADER}
        style={{ background:'linear-gradient(105deg,#0c0e10 0%,rgba(216,43,13,0.06) 50%,#0c0e10 100%)' }}
      >
        <div className="absolute inset-0 diag-stripes opacity-50"/>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D]"/>
        <div className="relative flex items-end justify-between">
          <div>
            <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] tracking-[3px] uppercase mb-1">ML Model · 2026 Season</p>
            <div className="flex items-baseline gap-2">
              <h1 className="font-['Zen_Dots'] text-[32px] text-white font-normal">Formulytics</h1>
              <span className="font-['Alumni_Sans'] text-[13px] text-[#D82B0D] font-semibold">Model Performance Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] uppercase tracking-[2px]">Overall Accuracy</p>
              <p className="font-['Alumni_Sans_Inline_One'] text-[28px] text-[#D82B0D] leading-none">91.8%</p>
            </div>
            <div className="h-12 w-px bg-[rgba(124,152,158,0.2)]"/>
            <div className="text-right">
              <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] uppercase tracking-[2px]">Training Races</p>
              <p className="font-['Alumni_Sans_Inline_One'] text-[28px] text-white leading-none">480</p>
            </div>
          </div>
        </div>
      </div>

      <div className={INNER}>

        {/* Header text */}
        <div className="text-right">
          <h1 className={H1}>Formulytics</h1>
          <p className="font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]">ML model internals, accuracy metrics, and feature analysis</p>
        </div>

        {/* How it works strip */}
        <div className={PANEL}>
          <div className="flex items-center gap-3 mb-4">
            <i className="fa-solid fa-circle-nodes" style={{ color:'#D82B0D', fontSize:18 }}/>
            <h2 className={H2}>How Formulytics Works</h2>
          </div>
          <div className="grid grid-cols-4 gap-0">
            {[
              { step:'01', icon:'fa-solid fa-database',     label:'Data Ingestion',  desc:'FastF1 telemetry, lap times, sector data, tyre info ingested per session' },
              { step:'02', icon:'fa-solid fa-sliders',      label:'Feature Engineering', desc:'120+ computed features: ELO scores, rolling averages, circuit fingerprints' },
              { step:'03', icon:'fa-solid fa-brain',        label:'Gradient Boost',  desc:'XGBoost ensemble trained on 5 seasons — 480 races, 9,600 driver sessions' },
              { step:'04', icon:'fa-solid fa-dice',         label:'Race Simulation', desc:'10,000 stochastic simulations per race weekend produce probability distributions' },
            ].map((s, i) => (
              <div key={s.step} className={`relative p-5 ${i < 3 ? 'border-r border-[rgba(124,152,158,0.1)]' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-['Zen_Dots'] text-[10px] text-[#D82B0D] opacity-60">{s.step}</span>
                  <div className="h-px flex-1 bg-[rgba(216,43,13,0.2)]"/>
                  <i className={s.icon} style={{ color:'#D82B0D', fontSize:14 }}/>
                </div>
                <p className="font-['Zen_Dots'] text-[12px] text-white font-normal mb-2">{s.label}</p>
                <p className="font-['Alumni_Sans'] text-[12px] text-[#9FA0C3] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className={BORDER}/>
        </div>

        <SectionDivider variant="slash" />

        {/* Accuracy + Feature importance */}
        <div className="grid grid-cols-2 gap-4">

          {/* Accuracy by category */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-[2px] w-5 bg-[#D82B0D]"/>
              <h2 className={H2}>Prediction Accuracy by Category</h2>
            </div>
            {ACCURACY_OVERALL.map(a => (
              <AccuracyBar key={a.label} {...a}/>
            ))}
            <div className="mt-3 pt-3 border-t border-[rgba(124,152,158,0.1)]">
              <p className="font-['Alumni_Sans'] text-[11px] text-[#748386]">
                Evaluated on 2023–24 holdout set (seasons not seen during training). N = 480 races.
              </p>
            </div>
            <div className={BORDER}/>
          </div>

          {/* Feature importance */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-[2px] w-5 bg-[#7C989E]"/>
              <h2 className={H2}>Feature Importance</h2>
            </div>
            <div className="flex flex-col gap-2">
              {FEATURE_IMPORTANCE.map((f, i) => (
                <div key={f.feature} className="flex items-center gap-3">
                  <span className="font-['Zen_Dots'] text-[10px] text-[#748386] w-5 text-right shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="font-['Alumni_Sans'] text-[12px] text-[#d1d5dc] truncate">{f.feature}</span>
                      <span className="font-['Alumni_Sans'] text-[12px] text-white ml-2 shrink-0">{f.importance}%</span>
                    </div>
                    <div className="bg-[rgba(124,152,158,0.08)] rounded-full h-1">
                      <div
                        className="h-1 rounded-full"
                        style={{ width:`${f.importance}%`, background: CATEGORY_COLORS[f.category] ?? '#748386' }}
                      />
                    </div>
                  </div>
                  <span
                    className="font-['Alumni_Sans'] text-[10px] rounded px-1.5 py-0.5 shrink-0 capitalize"
                    style={{ background:`${CATEGORY_COLORS[f.category] ?? '#748386'}18`, color: CATEGORY_COLORS[f.category] ?? '#748386', border:`1px solid ${CATEGORY_COLORS[f.category] ?? '#748386'}33` }}
                  >
                    {f.category}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {Object.entries(CATEGORY_COLORS).map(([cat, clr]) => (
                <span key={cat} className="font-['Alumni_Sans'] text-[10px] rounded-full px-2 py-0.5 capitalize"
                  style={{ background:`${clr}15`, color:clr, border:`1px solid ${clr}30` }}>
                  {cat}
                </span>
              ))}
            </div>
            <div className={BORDER}/>
          </div>
        </div>

        <SectionDivider variant="data" />

        {/* Per-circuit breakdown + ELO weights */}
        <div className="grid grid-cols-2 gap-4">

          {/* Per-circuit accuracy */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-5">
              <i className="fa-solid fa-map" style={{ color:'#9FA0C3', fontSize:14 }}/>
              <h2 className={H2}>Circuit-Level Accuracy</h2>
            </div>
            <div className="flex flex-col gap-2">
              {CIRCUIT_BREAKDOWN.map(c => (
                <div key={c.circuit} className={`${SUB_CARD} !p-3 flex items-center gap-3`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background:'rgba(216,43,13,0.1)', border:'1px solid rgba(216,43,13,0.2)' }}>
                    <i className="fa-solid fa-flag-checkered" style={{ color:'#D82B0D', fontSize:12 }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="font-['Alumni_Sans'] text-[13px] text-white font-semibold">{c.circuit}</span>
                      <span className="font-['Zen_Dots'] text-[12px] text-[#D82B0D]">{c.accuracy}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-[rgba(124,152,158,0.08)] rounded-full h-1 flex-1">
                        <div className="h-1 rounded-full bg-[#D82B0D]" style={{ width:`${c.accuracy}%` }}/>
                      </div>
                      <span className="font-['Alumni_Sans'] text-[10px] text-[#9FA0C3] shrink-0">avg err {c.error}</span>
                    </div>
                  </div>
                  <span
                    className="font-['Alumni_Sans'] text-[10px] rounded px-2 py-0.5 shrink-0"
                    style={{ background:`${DIFFICULTY_COLORS[c.difficulty]}15`, color: DIFFICULTY_COLORS[c.difficulty], border:`1px solid ${DIFFICULTY_COLORS[c.difficulty]}30` }}
                  >
                    {c.difficulty}
                  </span>
                </div>
              ))}
            </div>
            <div className={BORDER}/>
          </div>

          {/* ELO factor weights */}
          <div className={PANEL}>
            <div className="flex items-center gap-3 mb-5">
              <i className="fa-solid fa-chart-column" style={{ color:'#7C989E', fontSize:14 }}/>
              <h2 className={H2}>ELO Algorithm Weights</h2>
            </div>
            <p className="font-['Alumni_Sans'] text-[13px] text-[#9FA0C3] mb-4 leading-relaxed">
              The ELO system is adapted for F1's multi-car, multi-factor environment. Each race updates a driver's rating using a weighted composite score:
            </p>
            <div className="flex flex-col gap-3 mb-5">
              {ELO_WEIGHTS.map(w => (
                <div key={w.factor} className={SUB_CARD}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-['Alumni_Sans'] text-[13px] text-white font-semibold">{w.factor}</span>
                    <span className="font-['Zen_Dots'] text-[14px] text-[#D82B0D] shrink-0 ml-2">{(w.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="bg-[rgba(124,152,158,0.08)] rounded-full h-1.5 mb-1.5">
                    <div className="h-1.5 rounded-full bg-[#D82B0D]" style={{ width:`${w.weight*100/0.35*100}%`, maxWidth:'100%' }}/>
                  </div>
                  <p className="font-['Alumni_Sans'] text-[11px] text-[#748386]">{w.desc}</p>
                </div>
              ))}
            </div>

            {/* K-factor note */}
            <div className="rounded-lg p-4 bg-[rgba(124,152,158,0.05)] border border-[rgba(124,152,158,0.12)]">
              <p className="font-['Zen_Dots'] text-[11px] text-[#7C989E] mb-1">K-Factor Design</p>
              <p className="font-['Alumni_Sans'] text-[12px] text-[#9FA0C3] leading-relaxed">
                K = 32 for drivers with &lt; 50 races · K = 24 for established drivers · K = 16 for multi-champion drivers.
                Adaptive K prevents rating stagnation while rewarding consistency over time.
              </p>
            </div>

            <div className={BORDER}/>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className={PANEL}>
          <div className="flex items-center gap-3 mb-4">
            <i className="fa-solid fa-trophy" style={{ color:'#f59e0b', fontSize:14 }}/>
            <h2 className={H2}>Training Data &amp; Validation Summary</h2>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {[
              { value:'5',    label:'Seasons',          sub:'2019–2024',           color:'#D82B0D' },
              { value:'480',  label:'Races',            sub:'training + holdout',   color:'#7C989E' },
              { value:'9,600',label:'Driver Sessions',  sub:'per-race observations',color:'#9FA0C3' },
              { value:'120+', label:'Features',         sub:'engineered inputs',    color:'#F0EBD8' },
              { value:'1.2M', label:'Telemetry Points', sub:'FastF1 ingested',      color:'#22c55e' },
              { value:'80/20',label:'Train/Test Split', sub:'stratified by season', color:'#f59e0b' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg" style={{ background:`${s.color}08`, border:`1px solid ${s.color}20` }}>
                <p className="font-['Alumni_Sans_Inline_One'] text-[24px] leading-none mb-1" style={{ color:s.color }}>{s.value}</p>
                <p className="font-['Zen_Dots'] text-[10px] text-white font-normal mb-0.5">{s.label}</p>
                <p className="font-['Alumni_Sans'] text-[10px] text-[#748386]">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className={BORDER}/>
        </div>

        <SectionDivider variant="sector" label="End of Model Report" />

      </div>
    </div>
  )
}