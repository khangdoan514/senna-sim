/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYOUT TOKENS — src/components/layout.ts
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tailwind className strings — use with className={}, not style={}.
 *
 * Palette:
 *   #D82B0D  Red Ochre   — primary accent (use this, NOT #e10600)
 *   #7C989E  Cool Steel  — secondary borders, hover states
 *   #748386  Slate Grey  — muted surfaces
 *   #F0EBD8  Eggshell    — high-contrast light text on coloured backgrounds
 *   #9FA0C3  Lavender    — metadata / secondary text
 *   #E8B84B  Gold        — mentor / highlight accent
 *
 * Status colors (use for pass/fail/warn indicators only):
 *   #22c55e  Green  — positive / fast
 *   #ef4444  Red    — negative / slow
 *   #f59e0b  Amber  — warning / mid
 */

// ─── ACCENT COLORS (use as JS constants in style={} when className won't work) ─
export const RED    = '#D82B0D'
export const STEEL  = '#7C989E'
export const SLATE  = '#748386'
export const EGG_HEX = '#F0EBD8'
export const LAVENDER = '#9FA0C3'
export const GOLD   = '#E8B84B'

// Status
export const GREEN = '#22c55e'
export const AMBER = '#f59e0b'
export const DANGER = '#ef4444'

// ─── PAGE WRAPPER ─────────────────────────────────────────────────────────────
export const PAGE = 'bg-[#080a0b] min-h-screen ml-[90px]'

// ─── INNER CONTENT AREA ───────────────────────────────────────────────────────
// Standard page padding — use on all pages for consistent gutters
export const INNER = 'pt-7 pr-[52px] pb-10 pl-[100px] flex flex-col gap-5'

// ─── PAGE HEADER BANNER ───────────────────────────────────────────────────────
// Full-bleed hero strip above INNER — matches INNER's horizontal gutter
export const PAGE_HEADER = 'relative overflow-hidden py-8 px-[100px] tire-texture-dark border-b border-[rgba(124,152,158,0.2)]'

// ─── PANEL ────────────────────────────────────────────────────────────────────
export const PANEL = 'relative bg-[#111416] rounded-xl p-6 border border-[rgba(124,152,158,0.14)] carbon-hex'

// ─── CARD ─────────────────────────────────────────────────────────────────────
export const CARD = 'relative bg-[#161a1d] rounded-xl p-5 border border-[rgba(124,152,158,0.12)] carbon-hex'

// ─── SUB CARD ─────────────────────────────────────────────────────────────────
export const SUB_CARD = 'bg-[#1c2124] rounded-lg p-4 border border-[rgba(124,152,158,0.15)] carbon-hex'

// ─── RACE REPLAY ──────────────────────────────────────────────────────────────
export const REPLAY_CHROME =
  'relative overflow-hidden rounded-xl border border-[rgba(124,152,158,0.14)] bg-[#111416] carbon-hex'

export const REPLAY_INNER_TILE =
  'flex min-h-0 flex-col justify-center gap-0.5 rounded-lg border border-[rgba(124,152,158,0.12)] bg-[#161a1d] px-2.5 py-2'

export const SIMULATION_SESSION_SURFACE =
  'relative rounded-xl border border-[rgba(124,152,158,0.12)] bg-[#161a1d] p-6 carbon-hex'

// ─── BORDER OVERLAY ───────────────────────────────────────────────────────────
export const BORDER = 'absolute inset-0 border border-[rgba(124,152,158,0.2)] rounded-[inherit] pointer-events-none'

// ─── RED BORDER (for active/highlighted panels) ───────────────────────────────
export const BORDER_RED = 'absolute inset-0 border border-[rgba(216,43,13,0.4)] rounded-[inherit] pointer-events-none'

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────

// Page title — 32px Zen Dots
export const H1 = "font-['Zen_Dots'] text-[32px] text-white font-normal mb-1"

// Section heading — 18px Zen Dots
export const H2 = "font-['Zen_Dots'] text-lg text-white font-normal"

// Card heading — 13px Zen Dots
export const H3 = "font-['Zen_Dots'] text-sm text-white font-normal"

// Page subtitle — 17px Alumni Sans lavender
export const SUBTITLE = "font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]"

// Label / metadata — 13px Alumni Sans lavender
export const META = "font-['Alumni_Sans'] text-[13px] text-[#9FA0C3]"

// Main body copy — 17px Alumni Sans lavender (section paragraphs, descriptions)
export const BODY = "font-['Alumni_Sans'] text-[17px] text-[#9FA0C3] leading-relaxed"

// Secondary body — 15px Alumni Sans lavender (card content, supporting copy)
export const BODY_SM = "font-['Alumni_Sans'] text-[15px] text-[#9FA0C3] leading-relaxed"

// Small label / fine print — 11px Alumni Sans (chart labels, axis text, fine print)
export const FINE = "font-['Alumni_Sans'] text-[11px] text-[#9FA0C3]"

// Large stat number — 52px Alumni Sans Inline One (impact stats, hero callouts)
export const NUM_LG = "font-['Alumni_Sans_Inline_One'] text-[52px] leading-none"

// Medium metric number — 36px Alumni Sans Inline One (model metrics, data callouts)
export const NUM_MD = "font-['Alumni_Sans_Inline_One'] text-[36px] leading-none"

// Eggshell accent text — use on coloured/team-colour backgrounds
export const EGG = "font-['Alumni_Sans'] text-[#F0EBD8]"