# TrackSense UI Standards

## Palette

| Token              | Hex         | Usage                                      |
|--------------------|-------------|--------------------------------------------|
| Red (primary)      | `#D82B0D`   | CTAs, accents, active states, alerts       |
| Steel (mid)        | `#7C989E`   | Secondary elements, borders, muted text    |
| Lavender (tertiary)| `#9FA0C3`   | Body text, meta labels, inactive states    |
| Eggshell           | `#F0EBD8`   | High-contrast text on dark cards           |
| Gold               | `#E8B84B`   | Mentor / special highlight accent only     |
| Dark bg            | `#080a0b`   | Page background                            |
| Card bg            | `#111416`   | Panel / card surfaces                      |
| Card bg light      | `#1c2124`   | Sub-card / nested surfaces                 |
| Green (positive)   | `#22c55e`   | Positive deltas, good ratings              |
| Amber (warning)    | `#f59e0b`   | Medium ratings, caution                    |
| Red (negative)     | `#ef4444`   | Negative deltas, poor ratings, errors      |

> **Red discipline:** The ONLY red accent is `#D82B0D`. Never use `#e10600`, `#fb2c36`, or any other red variant. These will be flagged in review.

---

## Typography

### Display / Stat numbers
Font: **Alumni Sans Inline One**
Use for all prominent numerical values: ELO ratings, percentages, lap times, big stats.
```
font-['Alumni_Sans_Inline_One'] text-[40px]   // hero stats
font-['Alumni_Sans_Inline_One'] text-[32px]   // section stats
font-['Alumni_Sans_Inline_One'] text-[24px]   // card stats
font-['Alumni_Sans_Inline_One'] text-[18px]   // table values
```

### Headings
Font: **Zen Dots**; for page titles, section headers, driver codes, badges
```
font-['Zen_Dots'] text-[32px]   // H1 (page title)
font-['Zen_Dots'] text-[20px]   // H2 (section title)
font-['Zen_Dots'] text-[13px]   // H3 (card heading / label)
font-['Zen_Dots'] text-[11px]   // Small label / code badge
```

### Body / Meta
Font: **Alumni Sans**: for all body text, descriptions, labels, UI chrome
```
font-['Alumni_Sans'] text-[17px]   // subheading / hero description
font-['Alumni_Sans'] text-[14px]   // body text / card content
font-['Alumni_Sans'] text-[12px]   // meta / secondary
font-['Alumni_Sans'] text-[11px]   // fine print / tracking labels
font-['Alumni_Sans'] text-[10px]   // column headers / pills
```

### Clarification numbers (exception)
Small inline numbers (table rows, data cells, axis labels) may use Alumni Sans or Zen Dots at ≤ 13px. These are **not** display numbers and do not need Alumni Sans Inline One.

---

## Page Structure

Every page must follow this shell:

```
<div className={PAGE}>
  <DRSSweep delay={80} />          {/* red blade on load to mimic F1 broadcast */}

  [optional: header strip]         {/* py-8 px-[100px] with left red bar */}
  [optional: ScrollVelocity strip] {/* borderTop: 2px solid #D82B0D */}

  <div className={INNER}>
    <SectionDivider variant="sector" label="Section Name" />
    ... content ...
    <SectionDivider variant="slash" />
    ... content ...
    <SectionDivider variant="data" />
    ... content ...
    <SectionDivider variant="sector" label="End of Report" />
  </div>
</div>
```

---

## Layout tokens (`src/components/layout.ts`)

| Token         | Value / purpose                                             |
|---------------|-------------------------------------------------------------|
| `PAGE`        | Root page wrapper: dark bg, left margin for sidebar         |
| `INNER`       | Content container: `pt-7 pr-[52px] pb-10 pl-[100px] gap-5` |
| `PAGE_HEADER` | Full-bleed banner above INNER, matches horizontal gutter    |
| `PANEL`       | Panel: rounded-xl, border, carbon-hex texture, p-6          |
| `CARD`        | Smaller panel variant with carbon-hex texture               |
| `SUB_CARD`    | Nested inner card with carbon-hex texture                   |
| `BORDER`      | Steel-tint inset border overlay (pointer-events-none)       |
| `BORDER_RED`  | Red inset border overlay for active/highlighted panels      |
| `H1`          | Page title: Zen Dots 32px                                   |
| `H2`          | Section header: Zen Dots 18px (use with animated red bar)   |
| `H3`          | Sub-section: Zen Dots 13px                                  |
| `SUBTITLE`    | Page subtitle: Alumni Sans 17px lavender                    |
| `META`        | Muted meta label: Alumni Sans 13px lavender                 |
| `BODY`        | Body copy: Alumni Sans 15px lavender                        |
| `FINE`        | Fine print / chart labels: Alumni Sans 11px lavender        |
| `DISPLAY`     | Hero stat numbers: Alumni Sans 40px white bold              |

**Color constants** (use in `style={{}}` when Tailwind className won't work):
`RED`, `STEEL`, `SLATE`, `EGG_HEX`, `LAVENDER`, `GOLD`, `GREEN`, `AMBER`, `DANGER`

---

## Section Dividers (`<SectionDivider />`)

Use between every major content section on every page. Three variants:

| Variant    | When to use                                        |
|------------|----------------------------------------------------|
| `"sector"` | Opening / closing a section: animated color bars  |
| `"slash"`  | Mid-page transition: livery diagonal + red line   |
| `"data"`   | Before dense data sections: scrolling telemetry   |

```tsx
<SectionDivider variant="sector" label="Section Name" />
<SectionDivider variant="slash" />
<SectionDivider variant="data" />
```

---

## Animated Section Headers (H2 with red bar)

Every section H2 should animate in with a growing red bar. Use the `AnimatedH2` pattern (already in Home, Performance, Telemetry):

```tsx
function AnimatedH2({ children, delay = 0 }) {
  // IntersectionObserver triggers vis state
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div style={{ height: 2, width: vis ? 24 : 0, background: '#D82B0D', transition: ... }} />
      <span className={H2} style={{ opacity: vis ? 1 : 0, ... }}>{children}</span>
    </div>
  )
}
```

---

## DRS Sweep

Every page must include `<DRSSweep delay={80} />` as the **first child** of the `PAGE` div. This is the red blade flash on page load; a site-wide consistency requirement.

---

## Cards

### Standard card border rule
- Top accent bar (3px, draws in from left via `scaleX` on scroll): use driver/team/accent color
- Left accent bar (on hover or always): `w-1` strip in the card's accent color
- Background: subtle gradient from `{color}18` to the dark card bg

### Hover micro-interactions
```
hover:-translate-y-1 hover:brightness-110   // card lift
transition-all duration-150                  // fast 150ms max
```

Never use slow transitions (>300ms) on hover, they feel sluggish.

---

## Scroll animations

Always use `IntersectionObserver` for scroll-triggered reveals. Pattern:

```tsx
const ref = useRef<HTMLDivElement>(null)
const [vis, setV] = useState(false)

useEffect(() => {
  const obs = new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
    { threshold: 0.2 }
  )
  obs.observe(ref.current!)
  return () => obs.disconnect()
}, [])
```

Animate: `opacity 0→1` + `translateY(16px)→0` over ~400ms with staggered delays for grids.

---

---

## Textures (utility classes)

| Class                | Where to use                                              |
|----------------------|-----------------------------------------------------------|
| `carbon-hex`         | **Panels and cards** — baked into PANEL/CARD/SUB_CARD     |
| `dot-grid`           | Chart areas, data-heavy containers                        |
| `diag-stripes`       | Page header banners, hero sections (as absolute overlay)  |
| `diag-stripes-heavy` | Stronger version for prominent hero sections              |
| `tire-texture`       | Colored team/driver header strips only                    |
| `tire-texture-dark`  | Surface stat tiles, colored gradient panels               |

> Do **not** add `tire-texture` or `tire-texture-dark` to plain dark panels — use `carbon-hex` instead (already in the tokens).

## Header strips (sub-pages)

Use the `PAGE_HEADER` token — do not write the className by hand:

```tsx
<div className={PAGE_HEADER} style={{ background: 'linear-gradient(105deg,#0c0e10 0%,rgba(...) 50%,#0c0e10 100%)' }}>
  <div className="absolute inset-0 diag-stripes opacity-50"/>
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D]"/>
  <div className="relative flex items-end justify-between">
    {/* title left, badge right */}
  </div>
</div>
```

Always include the `w-1 bg-[#D82B0D]` left bar — it is the visual identity anchor of every page.

---
