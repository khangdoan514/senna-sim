/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ELO RATINGS — src/pages/ELO.tsx
 * Route: /elo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays the custom TrackSense ELO ratings for all drivers.
 * Career-based ELO system built from race-by-race data since 1994.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Drivers table   — rank, driver code, name, team, ELO, races
 *  • How ELO Works   — formula explanation panel
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/elo/drivers?season=2026
 *    → DriverRow[]  { rank, name, short, team, rating, races }
 *    Replace: DRIVERS constant below
 */

import { useState } from "react";
import {
  PAGE,
  INNER,
  PANEL,
  BORDER,
  H1,
  H2,
  META,
  PAGE_HEADER,
} from "../components/layout";
import DRSSweep from "../components/DRSSweep";
import SectionDivider from "../components/SectionDivider";

const teamColor: Record<string, string> = {
  "Red Bull Racing": "#3671c6",
  McLaren: "#ff8000",
  Ferrari: "#e8002d",
  Mercedes: "#27f4d2",
  "Aston Martin": "#229971",
  Alpine: "#00a1e8",
  Williams: "#1868db",
  "Racing Bulls": "#6692ff",
  "Haas F1 Team": "#dee1e2",
  Audi: "#ff2d00",
  Cadillac: "#aaaaad",
};

interface DriverRow {
  rank: number;
  name: string;
  short: string;
  team: string;
  rating: number;
  races: number;
}

const DRIVERS: DriverRow[] = [
  {
    rank: 1,
    name: "Max Verstappen",
    short: "VER",
    team: "Red Bull Racing",
    rating: 1420.6,
    races: 229,
  },
  {
    rank: 2,
    name: "Oscar Piastri",
    short: "PIA",
    team: "McLaren",
    rating: 1330.7,
    races: 69,
  },
  {
    rank: 3,
    name: "Lando Norris",
    short: "NOR",
    team: "McLaren",
    rating: 1324.1,
    races: 154,
  },
  {
    rank: 4,
    name: "George Russell",
    short: "RUS",
    team: "Mercedes",
    rating: 1321.8,
    races: 154,
  },
  {
    rank: 5,
    name: "Lewis Hamilton",
    short: "HAM",
    team: "Ferrari",
    rating: 1297.6,
    races: 376,
  },
  {
    rank: 6,
    name: "Charles Leclerc",
    short: "LEC",
    team: "Ferrari",
    rating: 1274.2,
    races: 168,
  },
  {
    rank: 7,
    name: "Kimi Antonelli",
    short: "ANT",
    team: "Mercedes",
    rating: 1189.4,
    races: 26,
  },
  {
    rank: 8,
    name: "Carlos Sainz",
    short: "SAI",
    team: "Williams",
    rating: 1095.2,
    races: 224,
  },
  {
    rank: 9,
    name: "Sergio Perez",
    short: "PER",
    team: "Cadillac",
    rating: 1088.4,
    races: 276,
  },
  {
    rank: 10,
    name: "Fernando Alonso",
    short: "ALO",
    team: "Aston Martin",
    rating: 1036.2,
    races: 422,
  },
  {
    rank: 11,
    name: "Oliver Bearman",
    short: "BEA",
    team: "Haas F1 Team",
    rating: 1020.5,
    races: 30,
  },
  {
    rank: 12,
    name: "Arvid Lindblad",
    short: "LIN",
    team: "Racing Bulls",
    rating: 1005.3,
    races: 3,
  },
  {
    rank: 13,
    name: "Isack Hadjar",
    short: "HAD",
    team: "Red Bull Racing",
    rating: 1002.0,
    races: 26,
  },
  {
    rank: 14,
    name: "Alexander Albon",
    short: "ALB",
    team: "Williams",
    rating: 1000.2,
    races: 125,
  },
  {
    rank: 15,
    name: "Liam Lawson",
    short: "LAW",
    team: "Racing Bulls",
    rating: 997.6,
    races: 37,
  },
  {
    rank: 16,
    name: "Nico Hulkenberg",
    short: "HUL",
    team: "Audi",
    rating: 989.8,
    races: 236,
  },
  {
    rank: 17,
    name: "Pierre Gasly",
    short: "GAS",
    team: "Alpine",
    rating: 984.6,
    races: 175,
  },
  {
    rank: 18,
    name: "Esteban Ocon",
    short: "OCO",
    team: "Haas F1 Team",
    rating: 978.0,
    races: 176,
  },
  {
    rank: 19,
    name: "Gabriel Bortoleto",
    short: "BOR",
    team: "Audi",
    rating: 961.8,
    races: 25,
  },
  {
    rank: 20,
    name: "Lance Stroll",
    short: "STR",
    team: "Aston Martin",
    rating: 926.8,
    races: 187,
  },
  {
    rank: 21,
    name: "Franco Colapinto",
    short: "COL",
    team: "Alpine",
    rating: 918.9,
    races: 28,
  },
  {
    rank: 22,
    name: "Valtteri Bottas",
    short: "BOT",
    team: "Cadillac",
    rating: 896.6,
    races: 248,
  },
];

/* ── Formula block sub-components ─────────────────────────────────────────── */

function FormulaVar({
  children,
  color = "#9FA0C3",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: "'Zen Dots', sans-serif",
        fontSize: 20,
        color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        borderRadius: 4,
        padding: "1px 7px",
        display: "inline-block",
        lineHeight: "1.8",
      }}
    >
      {children}
    </span>
  );
}

function FormulaCard({
  label,
  expr,
  desc,
}: {
  label: string;
  expr: React.ReactNode;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "rgba(8,10,11,0.6)",
        border: "1px solid rgba(124,152,158,0.15)",
        borderRadius: 10,
        padding: "14px 18px",
      }}
    >
      <p
        style={{
          fontFamily: "'Alumni Sans', sans-serif",
          fontSize: 18,
          color: "#748386",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          margin: "0 0 6px",
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontFamily: "'Alumni Sans', sans-serif",
          fontSize: 20,
          color: "#F0EBD8",
          marginBottom: 8,
        }}
      >
        {expr}
      </div>
      <p
        style={{
          fontFamily: "'Alumni Sans', sans-serif",
          fontSize: 15,
          color: "#9FA0C3",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

export default function ELO() {
  const [hovRow, setHovRow] = useState<number | null>(null);

  return (
    <div className={PAGE}>
      {/* ── DRS page-load sweep ─────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      {/* Header strip */}
      <div
        className={PAGE_HEADER}
        style={{
          background:
            "linear-gradient(105deg,#0c0e10 0%,rgba(159,160,195,0.07) 50%,#0c0e10 100%)",
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D]" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="font-['Alumni_Sans'] text-[11px] text-[#7C989E] tracking-[3px] uppercase mb-1">
              Career Rankings
            </p>
            <h1 className="font-['Zen_Dots'] text-[32px] text-white font-normal">
              ELO Ratings
            </h1>
          </div>
          <span className="font-['Alumni_Sans'] text-sm text-[#9FA0C3] border border-[rgba(124,152,158,0.3)] rounded-lg py-1.5 px-4">
            2026 Grid · Career-Based
          </span>
        </div>
      </div>

      <div className={INNER}>
        <SectionDivider variant="sector" label="Driver ELO Rankings" />

        {/* ── DRIVERS TABLE ────────────────────────────────────────────── */}
        <div className={PANEL}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[2px] w-5 bg-[#D82B0D]" />
            <h2 className={H2}>Driver ELO Rankings</h2>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[40px_44px_1fr_160px_100px_70px] gap-2 px-4 pb-3 border-b border-[rgba(124,152,158,0.1)]">
            {["Rank", "#", "Driver", "Team", "ELO", "Races"].map((h) => (
              <span
                key={h}
                className="font-['Alumni_Sans'] text-[18px] text-[#748386] uppercase tracking-[1px]"
              >
                {h}
              </span>
            ))}
          </div>

          {DRIVERS.map((d) => (
            <div
              key={d.rank}
              onMouseEnter={() => setHovRow(d.rank)}
              onMouseLeave={() => setHovRow(null)}
              className="grid grid-cols-[40px_44px_1fr_160px_100px_70px] gap-2 px-4 py-[10px] items-center border-b border-[rgba(124,152,158,0.06)] transition-colors duration-100"
              style={{
                background:
                  hovRow === d.rank ? "rgba(124,152,158,0.04)" : "transparent",
              }}
            >
              {/* Rank */}
              <span
                className="font-['Zen_Dots'] text-[15px]"
                style={{ color: d.rank <= 3 ? "#D82B0D" : "#748386" }}
              >
                {d.rank}
              </span>

              {/* Driver code badge */}
              <span
                className="font-['Zen_Dots'] text-[12px] px-1 py-0.5 rounded text-center"
                style={{
                  background: `${teamColor[d.team] ?? "#748386"}18`,
                  color: teamColor[d.team] ?? "#748386",
                  border: `1px solid ${teamColor[d.team] ?? "#748386"}33`,
                }}
              >
                {d.short}
              </span>

              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-[3px] h-[16px] rounded-full shrink-0"
                  style={{ background: teamColor[d.team] ?? "#748386" }}
                />
                <span className="font-['Alumni_Sans'] text-[22px] text-white font-semibold truncate">
                  {d.name}
                </span>
              </div>

              {/* Team */}
              <span className="font-['Alumni_Sans'] text-[22px] text-[#9FA0C3] truncate">
                {d.team}
              </span>

              {/* ELO */}
              <span className="font-['Alumni_Sans_Inline_One'] text-[25px] text-[#F0EBD8]">
                {d.rating.toFixed(1)}
              </span>

              {/* Races */}
              <span className="font-['Alumni_Sans'] text-[25px] text-[#748386]">
                {d.races}
              </span>
            </div>
          ))}

          <div className={BORDER} />
        </div>

        <SectionDivider variant="slash" />

        {/* ── HOW ELO IS CALCULATED ───────────────────────────────────── */}
        <div className={PANEL}>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-[2px] w-5 bg-[#9FA0C3]" />
            <h2 className={H2}>How ELO Is Calculated</h2>
          </div>
          <p className={`${META} text-[12px] mb-5`}>
            A career-based rating built race by race from 1994 to present —
            every finish counts.
          </p>

          {/* Core formula */}
          <div
            style={{
              background: "rgba(216,43,13,0.06)",
              border: "1px solid rgba(216,43,13,0.25)",
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Alumni Sans', sans-serif",
                fontSize: 20,
                color: "#748386",
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: "0 0 10px",
              }}
            >
              Core Formula — applied after every race
            </p>
            <div
              style={{
                fontFamily: "'Alumni Sans', sans-serif",
                fontSize: 40,
                color: "#F0EBD8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <FormulaVar color="#D82B0D">ELO</FormulaVar>
              <span style={{ color: "#748386" }}>+=</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FormulaVar color="#9FA0C3">K</FormulaVar>
                <span style={{ color: "#748386", fontSize: 30 }}>×</span>
                <span style={{ color: "#748386" }}>(</span>
                <FormulaVar color="#22c55e">S</FormulaVar>
                <span style={{ color: "#748386" }}>−</span>
                <FormulaVar color="#3671c6">E</FormulaVar>
                <span style={{ color: "#748386" }}>)</span>
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Alumni Sans', sans-serif",
                fontSize: 18,
                color: "#748386",
                margin: "10px 0 0",
                lineHeight: 1.6,
              }}
            >
              This update runs for every driver in every race. Positive when you
              outperform expectations; negative when you underperform.
            </p>
          </div>

          {/* Variable cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            <FormulaCard
              label="K — race weight"
              expr={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <FormulaVar color="#9FA0C3">K</FormulaVar>
                  <span style={{ color: "#748386" }}>=</span>
                  <span style={{ color: "#F0EBD8" }}>|</span>
                  <FormulaVar color="#ff8000">Pf</FormulaVar>
                  <span style={{ color: "#748386" }}>− 2</span>
                  <FormulaVar color="#9FA0C3">Py</FormulaVar>
                  <span style={{ color: "#748386" }}>+</span>
                  <FormulaVar color="#6692ff">Pb</FormulaVar>
                  <span style={{ color: "#F0EBD8" }}>|</span>
                </span>
              }
              desc="How much a race is worth. Pf = points of the driver directly ahead of you in the standings at race time; Py = your own points; Pb = points of the driver behind you. A bigger gap between you and your neighbours means a higher-stakes race."
            />

            <FormulaCard
              label="S — score"
              expr={
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FormulaVar color="#22c55e">S</FormulaVar>
                  <span style={{ color: "#748386" }}>=</span>
                  <span style={{ color: "#F0EBD8" }}>drivers beaten</span>
                  <span style={{ color: "#748386" }}>÷</span>
                  <span style={{ color: "#F0EBD8" }}>field size</span>
                </span>
              }
              desc="The fraction of the field you finished ahead of. Winning a 20-car race gives S = 0.95 (you beat 19 of 20 — everyone except yourself). Last place gives S ≈ 0. Always between 0 and 1."
            />

            <FormulaCard
              label="E — expected score"
              expr={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <FormulaVar color="#3671c6">E</FormulaVar>
                  <span style={{ color: "#748386" }}>=</span>
                  <span style={{ color: "#748386" }}>avg of</span>
                  <span style={{ color: "#F0EBD8", fontSize: 18 }}>
                    1 ÷ (1 + 10^((Rj − Ri) / 400))
                  </span>
                </span>
              }
              desc="For each rival j in the race, this computes the probability you beat them based on your respective ELO ratings Ri and Rj. E is the average across all rivals — your expected finishing share if the field matched your ratings perfectly."
            />
          </div>

          {/* Worked example */}
          <div
            style={{
              marginTop: 16,
              background: "rgba(124,152,158,0.05)",
              border: "1px solid rgba(124,152,158,0.12)",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <p
              style={{
                fontFamily: "'Alumni Sans', sans-serif",
                fontSize: 10,
                color: "#748386",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                margin: "0 0 8px",
              }}
            >
              Reading the result
            </p>
            <p
              style={{
                fontFamily: "'Alumni Sans', sans-serif",
                fontSize: 18,
                color: "#9FA0C3",
                margin: 0,
                lineHeight: 1.65,
              }}
            >
              If a driver beats more of the field than their rating predicted (
              <span style={{ color: "#22c55e" }}>S</span>
              {" > "}
              <span style={{ color: "#3671c6" }}>E</span>
              ), their ELO rises. If they finish below expectations, it falls.
              The magnitude is scaled by{" "}
              <span
                style={{
                  fontFamily: "'Zen Dots', sans-serif",
                  fontSize: 12,
                  color: "#9FA0C3",
                }}
              >
                K
              </span>{" "}
              — a battle for the championship lead is worth far more than a
              mid-table scrap with nothing at stake. All drivers start at{" "}
              <span style={{ color: "#F0EBD8" }}>1000</span> and their career
              rating accumulates from every race they've ever entered.
            </p>
          </div>

          <div className={BORDER} />
        </div>
      </div>
    </div>
  );
}
