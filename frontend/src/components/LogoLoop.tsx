/**
 * LOGO LOOP — infinite scrolling marquee of tech stack logos.
 * Two rows going opposite directions. Pauses on hover.
 */

import { CSSProperties } from 'react'

export interface LogoItem {
  label:  string
  svg:    string
  color?: string
}

interface LogoLoopProps {
  items:      LogoItem[]
  speed?:     number
  direction?: 'left' | 'right'
  gap?:       number
  style?:     CSSProperties
}

export default function LogoLoop({ items, speed = 28, direction = 'left', gap = 40, style }: LogoLoopProps) {
  const tripled = [...items, ...items, ...items]

  return (
    <div
      className="overflow-hidden w-full py-[10px]"
      style={{
        maskImage: 'linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)',
        ...style,
      }}
    >
      <style>{`
        @keyframes ll-left  { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        @keyframes ll-right { from{transform:translateX(-33.333%)} to{transform:translateX(0)} }
        .ll-track { display:flex; will-change:transform; }
        .ll-track:hover { animation-play-state:paused !important; }
        .ll-item { transition: border-color 0.2s, background 0.2s, transform 0.2s; }
        .ll-item:hover { border-color:rgba(216,43,13,0.7)!important; background:rgba(216,43,13,0.1)!important; transform:translateY(-2px); }
      `}</style>
      <div
        className="ll-track items-center"
        style={{
          animation: `ll-${direction} ${speed}s linear infinite`,
          gap,
        }}
      >
        {tripled.map((item, i) => (
          <div
            key={i}
            className="ll-item flex items-center gap-[10px] bg-white/[0.04] border border-[rgba(216,43,13,0.2)] rounded-lg py-2 px-4 whitespace-nowrap shrink-0"
          >
            <span
              className="flex items-center h-[22px] w-[22px] shrink-0"
              dangerouslySetInnerHTML={{ __html: item.svg }}
            />
            <span
              className="font-['Alumni_Sans'] text-sm font-semibold tracking-[0.3px]"
              style={{ color: item.color ?? '#d1d5dc' }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LOGO SVG DEFINITIONS ────────────────────────────────────────────────────
export const LOGOS: Record<string, LogoItem> = {
  python: {
    label: 'Python', color: '#ffd43b',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M11.9 2C9.2 2 7 3.4 7 5.2v1.3h5v.5H5.5C3.5 7 2 8.8 2 11c0 2.3 1.5 4.2 3.5 4.4H7v-1.5c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5V17h1.5c2-.2 3.5-2.1 3.5-4.4 0-2.2-1.5-4-3.5-4H17v-.5h5V5.2C22 3.4 19.8 2 17 2h-5.1z" fill="#3776AB"/><path d="M12 14.5c-2.8 0-5 1.5-5 3.3v1.4c0 1.8 2.2 2.8 5 2.8s5-1 5-2.8v-1.4c0-1.8-2.2-3.3-5-3.3z" fill="#FFD43B"/><circle cx="9.5" cy="6.5" r="1" fill="#fff"/><circle cx="14.5" cy="17.5" r="1" fill="#3776AB"/></svg>`,
  },
  fastapi: {
    label: 'FastAPI', color: '#009688',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#009688"/><path d="M13 4l-5 9h4l-1 7 6-9h-4z" fill="#fff"/></svg>`,
  },
  fastf1: {
    label: 'FastF1', color: '#D82B0D',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h4l2-6 4 12 2-6h6" stroke="#D82B0D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  pandas: {
    label: 'Pandas', color: '#e070b0',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3" width="4" height="18" rx="2" fill="#6a4fc8"/><rect x="15" y="3" width="4" height="18" rx="2" fill="#E70488"/><rect x="9" y="8" width="6" height="3" rx="1" fill="#6a4fc8"/><rect x="9" y="13" width="6" height="3" rx="1" fill="#E70488"/></svg>`,
  },
  numpy: {
    label: 'NumPy', color: '#4DABCF',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L3 8v8l9 5 9-5V8L12 3z" stroke="#4DABCF" stroke-width="1.4" fill="none"/><path d="M3 8l9 5 9-5" stroke="#4DABCF" stroke-width="1.4" fill="none"/><path d="M12 13v8" stroke="#4DABCF" stroke-width="1.4" fill="none"/></svg>`,
  },
  sklearn: {
    label: 'scikit-learn', color: '#F7931E',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="#F7931E" stroke-width="1.4" fill="none"/><path d="M8 12a4 4 0 0 1 8 0" stroke="#F7931E" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#F7931E"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#3499CD" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  },
  react: {
    label: 'React', color: '#61dafb',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2" fill="#61DAFB"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" stroke-width="1.2" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" stroke-width="1.2" fill="none" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" stroke-width="1.2" fill="none" transform="rotate(120 12 12)"/></svg>`,
  },
  typescript: {
    label: 'TypeScript', color: '#3178c6',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#3178C6"/><path d="M6 10h4M8 10v7M14 17c-.5.4-1.2.4-1.8.2-1-.5-1.2-1.7-1.2-2.7 0-1 .2-2.2 1.2-2.7.6-.3 1.3-.3 1.8.1M18 14h-2.5c0-1 .8-1.7 1.7-1.3.5.2.8.8.8 1.3z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  },
  vite: {
    label: 'Vite', color: '#646cff',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M21 3L12.5 19.5 10 14 6 16 11 3h10z" fill="#646CFF"/><path d="M10 14L3 5.5l7.5 2L12.5 19.5 10 14z" fill="#FFBD2F"/></svg>`,
  },
  tailwind: {
    label: 'Tailwind CSS', color: '#38bdf8',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 10C7.2 7.3 8.8 6 11.5 6c4 0 4.5 3 6.5 3.5-1 2.7-2.7 4-5.5 4-4 0-4.5-3-6-3.5zM1 16c.7-2.7 2.3-4 5-4 4 0 4.5 3 6.5 3.5C11.5 18.2 9.8 19.5 7 19.5c-4 0-4.5-3-6-3.5z" fill="#38BDF8"/></svg>`,
  },
  reactrouter: {
    label: 'React Router', color: '#f44250',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2.5" fill="#F44250"/><circle cx="19" cy="5" r="2.5" fill="#F44250"/><circle cx="19" cy="19" r="2.5" fill="#F44250"/><path d="M7.5 12h5a4 4 0 0 0 4-4" stroke="#F44250" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M7.5 12h5a4 4 0 0 1 4 4" stroke="#F44250" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
  },
  lucide: {
    label: 'Lucide', color: '#f97316',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="6.5" cy="6.5" r="3" stroke="#f97316" stroke-width="1.4" fill="none"/><rect x="14" y="3.5" width="5.5" height="5.5" rx="1.2" stroke="#f97316" stroke-width="1.4" fill="none"/><path d="M4 15.5l2.5 4 2.5-4H4z" stroke="#f97316" stroke-width="1.3" stroke-linejoin="round" fill="none"/><path d="M16.5 15v5M14 17.5h5" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
}

// Row 1 — Backend & Data
export const TECH_ROW_1: LogoItem[] = [
  LOGOS.python, LOGOS.fastapi, LOGOS.fastf1, LOGOS.pandas, LOGOS.numpy, LOGOS.sklearn,
]

// Row 2 — Frontend
export const TECH_ROW_2: LogoItem[] = [
  LOGOS.react, LOGOS.typescript, LOGOS.vite, LOGOS.tailwind, LOGOS.reactrouter, LOGOS.lucide,
]
