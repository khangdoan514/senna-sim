/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DRIVERS — src/pages/Drivers.tsx
 * Route: /drivers
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full 2026 grid browser. Each driver has a photo card in a 5-column grid.
 * Clicking a card expands an inline detail panel below that row showing:
 * biography, career stats, "The Moment" image + caption, and ELO rating.
 *
 * ─── SECTIONS ────────────────────────────────────────────────────────────────
 *  • Header + search  — filter grid by driver name, team, or nationality
 *  • Driver grid      — 5-per-row photo cards (portrait aspect ratio)
 *                       selected card lifts + shows accent border + indicator dot
 *  • Detail panel     — expands inline below the selected driver's row:
 *      · Bio + Career Stats   — paragraph + 4-stat grid (WDC/Wins/Poles/Podiums)
 *      · The Moment           — key race image + caption (src/assets/driverbios_moments/)
 *      · ELO Rating           — current career rating
 *
 * ─── PHOTO ASSETS ────────────────────────────────────────────────────────────
 *  Headshots:  src/assets/driverbios_photos/{photoId}.jpeg
 *  Moments:    src/assets/driverbios_moments/{photoId}.jpeg
 *
 *  photoId values are set per driver in the DRIVERS array below (e.g.
 *  'maxverstappen', 'landonorris'). Falls back to driver code badge if missing.
 *  Only pierregasly.jpeg currently exists in moments — others show placeholder.
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/drivers?season=2026
 *    → Driver[]  (full array matching the Driver interface below)
 *    Replace: DRIVERS constant
 *    Note: include `photoId` field (filename stem, no extension) so the
 *          glob asset lookup continues to work without changes
 *
 *  GET /api/elo/drivers?season=2026
 *    → { id, rating }[]
 *    Can be merged into the drivers endpoint or fetched separately.
 *    Replace: eloRating field on each driver
 *
 * ─── MOCK DATA TO REPLACE ────────────────────────────────────────────────────
 *  DRIVERS  — 22 drivers with bios, stats, moment captions, ELO rating
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PAGE, INNER, H1, META, PAGE_HEADER } from "../components/layout";
import DRSSweep from "../components/DRSSweep";
import SectionDivider from "../components/SectionDivider";

// ─── PHOTO + MOMENT ASSETS ───────────────────────────────────────────────────
const PHOTOS = import.meta.glob("../assets/driverbios_photos/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const MOMENTS = import.meta.glob("../assets/driverbios_moments/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function getAsset(store: Record<string, string>, id: string): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const hit = Object.entries(store).find(([k]) =>
      k.endsWith(`/${id}.${ext}`),
    );
    if (hit) return hit[1];
  }
  return null;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Driver {
  id: string;
  photoId: string;
  number: number;
  name: string;
  short: string;
  team: string;
  nationality: string;
  flag: string;
  color: string;
  bio: string;
  stats: { label: string; value: string }[];
  moment: { caption: string; year: string };
  eloRating: number;
}

// ─── MOCK DATA — replace with GET /api/drivers?season=2026 ───────────────────
const DRIVERS: Driver[] = [
  {
    id: "ver",
    photoId: "maxverstappen",
    number: 1,
    name: "Max Verstappen",
    short: "VER",
    team: "Red Bull Racing",
    nationality: "Dutch",
    flag: "🇳🇱",
    color: "#5588d8",
    bio: "The most dominant driver of the turbo-hybrid era, Max Verstappen claimed four consecutive World Championships. Known for ice-cold racecraft and supernatural car feel.",
    stats: [
      { label: "WDC", value: "4" },
      { label: "Wins", value: "71" },
      { label: "Poles", value: "48" },
      { label: "Podiums", value: "127" },
    ],
    moment: {
      caption:
        "2021 Abu Dhabi Grand Prix — With Hamilton seemingly certain to claim an eighth world title, the safety car restart on lap 58 changed everything. Verstappen, on fresh soft tyres against Hamilton's worn hards, swept past his rival into Turn 5 with a decisive, clean move that sent the crowd into delirium. It was the culmination of the most intense title battle in a generation — 22 races, two drivers, separated by a single point going into the finale. That overtake didn't just win a championship; it announced a new era.",
      year: "2021",
    },
    eloRating: 1420.6,
  },
  {
    id: "had",
    photoId: "isackhadjar",
    number: 6,
    name: "Isack Hadjar",
    short: "HAD",
    team: "Red Bull Racing",
    nationality: "French",
    flag: "🇫🇷",
    color: "#1f509a",
    bio: "The French-Algerian prodigy who claimed the 2024 Formula 2 championship for Red Bull. Ice-cold under pressure, Hadjar is built in the Verstappen mould. He started his F1 career in VCARB and has since been promoted to Red Bull for the 2026 season.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "1" },
    ],
    moment: {
      caption:
        "2025 Dutch Grand Prix in Zandvoort - His first podium in Formula 1 was a spectacular one, beating out the likes of George Russell and Alex Albon after three top-team contenders (Lewis Hamilton, Charles Leclerc, and Lando Norris) all did not finish the race. Hadjar carried his midfield car to the finish line 2 seconds ahead of Russell to secure himself his first and most memorable podium in his career.",
      year: "2025",
    },
    eloRating: 1002.0,
  },
  {
    id: "nor",
    photoId: "landonorris",
    number: 4,
    name: "Lando Norris",
    short: "NOR",
    team: "McLaren",
    nationality: "British",
    flag: "🇬🇧",
    color: "#ffa333",
    bio: "The face of McLaren's revival. Breakthrough win at Miami 2024 announced his arrival as a genuine championship contender. Fastest lap on natural ability.",
    stats: [
      { label: "WDC", value: "1" },
      { label: "Wins", value: "11" },
      { label: "Poles", value: "16" },
      { label: "Podiums", value: "44" },
    ],
    moment: {
      caption:
        "2024 Miami Grand Prix — After 110 Formula 1 starts, countless near-misses, and years of quietly carrying McLaren through their rebuilding phase, Lando Norris finally stood on the top step. He didn't just win — he dominated. From the moment he cleared Verstappen in the opening stint, Norris controlled every aspect of the race: tyre management, gap management, the mental load of finally having victory within his grasp. When he crossed the line, the emotion in his voice on team radio said everything that words couldn't. The wait was over.",
      year: "2024",
    },
    eloRating: 1324.1,
  },
  {
    id: "pia",
    photoId: "oscarpiastri",
    number: 81,
    name: "Oscar Piastri",
    short: "PIA",
    team: "McLaren",
    nationality: "Australian",
    flag: "🇦🇺",
    color: "#cc6600",
    bio: "The most mature rookie in recent memory. Arrived in F1 knowing exactly how to win, with unshakeable composure that belies his youth.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "9" },
      { label: "Poles", value: "6" },
      { label: "Podiums", value: "27" },
    ],
    moment: {
      caption:
        "2024 Hungarian Grand Prix — McLaren arrived at the Hungaroring with a car capable of a 1-2 finish, and the team's instruction was clear: hold position, bring the points home. Piastri had other ideas. Sitting behind Norris in second place, he refused to simply follow his teammate to the flag. He applied relentless pressure, found a gap, and made the move stick — an act of pure racing instinct from a driver who was supposed to be in his first full season. It told everyone watching that Piastri was not in Formula 1 to support anyone.",
      year: "2024",
    },
    eloRating: 1330.7,
  },
  {
    id: "lec",
    photoId: "charlesleclerc",
    number: 16,
    name: "Charles Leclerc",
    short: "LEC",
    team: "Ferrari",
    nationality: "Monégasque",
    flag: "🇲🇨",
    color: "#ff2848",
    bio: "Born in Monaco, carrying Ferrari expectation with grace. One of the finest qualifiers on the grid with natural street-circuit brilliance.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "8" },
      { label: "Poles", value: "27" },
      { label: "Podiums", value: "52" },
    ],
    moment: {
      caption:
        "2019 Italian Grand Prix — Monza was on a knife's edge. Ferrari hadn't won at their home circuit in years, the tifosi were desperate, and Hamilton was hunting. Leclerc, in just his second season, drove with the authority of a veteran — controlling the pace, fending off Hamilton's late-race charge with textbook defensive lines, and crossing the line to trigger scenes of absolute pandemonium in the grandstands. He won the following week in Singapore too, but it was Monza — the temple of speed, the home of Ferrari — that defined what Charles Leclerc was made of.",
      year: "2019",
    },
    eloRating: 1274.2,
  },
  {
    id: "ham",
    photoId: "lewishamilton",
    number: 44,
    name: "Lewis Hamilton",
    short: "HAM",
    team: "Ferrari",
    nationality: "British",
    flag: "🇬🇧",
    color: "#b00022",
    bio: "Seven World Championships. 103 wins. The most decorated driver in Formula 1 history — now at Ferrari to chase an eighth title alongside Leclerc.",
    stats: [
      { label: "WDC", value: "7" },
      { label: "Wins", value: "105" },
      { label: "Poles", value: "104" },
      { label: "Podiums", value: "203" },
    ],
    moment: {
      caption:
        "2008 Brazilian Grand Prix — Hamilton needed fifth place to win his first championship. On the penultimate lap of the final race, he dropped to sixth behind Timo Glock's slowing Toyota and the title slipped to Massa. Then, with less than a kilometre to the chequered flag, Glock — on dry tyres in worsening wet conditions — began to fall away. Hamilton found him, passed him, and reclaimed fifth. He crossed the line and became World Champion by a single point — arguably the most dramatic final lap in the history of the sport. Hamilton punched the roof of his car and sobbed. He was twenty-three years old.",
      year: "2008",
    },
    eloRating: 1297.6,
  },
  {
    id: "rus",
    photoId: "georgerussell",
    number: 63,
    name: "George Russell",
    short: "RUS",
    team: "Mercedes",
    nationality: "British",
    flag: "🇬🇧",
    color: "#55f7db",
    bio: "Now leading Mercedes into a new era alongside Antonelli. Precision-engineered and frighteningly consistent, Russell is the team's senior anchor.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "6" },
      { label: "Poles", value: "8" },
      { label: "Podiums", value: "26" },
    ],
    moment: {
      caption:
        "2021 Sakhir Grand Prix — Hamilton was in hospital with COVID-19. Russell had 48 hours' notice. He climbed into the Mercedes — the fastest car on the grid, a machine he had never raced — and proceeded to qualify second and lead the race by a significant margin. He was on course for a fairytale debut victory when a disastrous botched pit stop sent him out with the wrong tyres, and a puncture destroyed his race. He finished ninth through no fault of his own. The performance, however, left no one in any doubt: George Russell belonged at the very front of Formula 1.",
      year: "2021",
    },
    eloRating: 1321.8,
  },
  {
    id: "ant",
    photoId: "kimiantonelli",
    number: 12,
    name: "Kimi Antonelli",
    short: "ANT",
    team: "Mercedes",
    nationality: "Italian",
    flag: "🇮🇹",
    color: "#1ab89d",
    bio: "Hand-picked by Mercedes at 18, Antonelli was one of the most hyped rookies of the modern era. His start to the 2026 season has George Russell fighting hard for the top spot of the championship standings.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "2" },
      { label: "Poles", value: "2" },
      { label: "Podiums", value: "6" },
    ],
    moment: {
      caption:
        "2026 Chinese Grand Prix — Nobody expected the eighteen-year-old to win this early. Antonelli had been fast, impressively fast, but the expectation was that race victories would come later — in his second year, perhaps, once the nerves had settled and the experience had accumulated. Instead, on a cool afternoon in Shanghai, he produced a drive of such controlled aggression that the paddock fell quiet trying to process it. He led from the restart, managed a faster Russell behind him for fifteen laps, and crossed the line to become the second youngest race winner in Formula 1 history. For a brief, surreal moment, Kimi Antonelli led the World Drivers' Championship.",
      year: "2026",
    },
    eloRating: 1189.4,
  },
  {
    id: "alo",
    photoId: "fernandoalonso",
    number: 14,
    name: "Fernando Alonso",
    short: "ALO",
    team: "Aston Martin",
    nationality: "Spanish",
    flag: "🇪🇸",
    color: "#33bb88",
    bio: "Two-time world champion, Le Mans and Indy 500 winner. His hunger for victory after 24 years at the limit is utterly undiminished.",
    stats: [
      { label: "WDC", value: "2" },
      { label: "Wins", value: "32" },
      { label: "Poles", value: "22" },
      { label: "Podiums", value: "106" },
    ],
    moment: {
      caption:
        "2005 San Marino Grand Prix — Imola, mid-season, and Schumacher was closing. For several laps, the world champion applied everything he had — feint, pressure, slipstream — to try to find a way past the young Spaniard ahead. Alonso, twenty-three years old and in only his first season as a frontrunner, answered every single move with a perfectly placed defensive response. Not desperate, not ragged — calm. Engineered. He held Schumacher off to win and in doing so announced to the sport that the Schumacher era was over. The new champion had arrived, and he wasn't going to yield to anyone.",
      year: "2005",
    },
    eloRating: 1036.2,
  },
  {
    id: "str",
    photoId: "lancestroll",
    number: 18,
    name: "Lance Stroll",
    short: "STR",
    team: "Aston Martin",
    nationality: "Canadian",
    flag: "🇨🇦",
    color: "#157050",
    bio: "Steadily matured into a reliable top-10 performer. Natural feel in wet conditions and on street circuits is consistently underrated.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "1" },
      { label: "Podiums", value: "3" },
    ],
    moment: {
      caption:
        "2020 Turkish Grand Prix — Istanbul Park was an ice rink. Drivers with decades of experience were spinning off, sliding wide, struggling with a surface that offered almost no grip. Stroll, twenty-one years old, drove as if the conditions had been tailored for him. He was consistently two or three seconds per lap faster than anyone else in the final stint, pulling away from a field that included multiple world champions. He took pole, led from the front, and won with authority. It remains one of the most unexpectedly dominant wet-weather performances Formula 1 has seen in years.",
      year: "2020",
    },
    eloRating: 926.8,
  },
  {
    id: "sai",
    photoId: "carlossainz",
    number: 55,
    name: "Carlos Sainz",
    short: "SAI",
    team: "Williams",
    nationality: "Spanish",
    flag: "🇪🇸",
    color: "#3a82ea",
    bio: "Son of a World Rally champion, Sainz has forged his own identity through extraordinary adaptability. His arrival at Williams signals genuine ambition from Grove.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "4" },
      { label: "Poles", value: "6" },
      { label: "Podiums", value: "29" },
    ],
    moment: {
      caption:
        "2023 Singapore Grand Prix — The Marina Bay street circuit rewards precision above all else, and Sainz delivered a masterclass. He qualified on pole and led every single lap of the race, managing traffic, managing his tyres, and managing the threat from Norris who was hunting him in the final stint on fresher rubber. The rain had threatened, the safety car had bunched the field, and still Sainz did not flinch. He won by less than half a second — a result that demanded total commitment for 62 consecutive laps. Carlos Sainz, fully formed, best in the world that weekend.",
      year: "2023",
    },
    eloRating: 1095.2,
  },
  {
    id: "alb",
    photoId: "alexalbon",
    number: 23,
    name: "Alexander Albon",
    short: "ALB",
    team: "Williams",
    nationality: "Thai",
    flag: "🇹🇭",
    color: "#0f4faa",
    bio: "Cast aside by Red Bull, Albon rebuilt methodically at Williams and is now the clear benchmark at Grove — the perfect teammate for Sainz.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "2" },
    ],
    moment: {
      caption:
        "2020 Bahrain Grand Prix — Albon had started from the back of the grid following a penalty, and over the course of the race he picked his way through the field with relentless patience and precision. By the closing stages he was behind only Hamilton, and on the final lap he made a bold lunge at the Mercedes — only for Hamilton, under the enormous pressure of the moment, to make contact and send him into a spin. Third place instead of second, heartbreak instead of history. But the drive itself was extraordinary: a reminder that Albon's talent was never in question, only his fortune.",
      year: "2020",
    },
    eloRating: 1000.2,
  },
  {
    id: "gas",
    photoId: "pierregasly",
    number: 10,
    name: "Pierre Gasly",
    short: "GAS",
    team: "Alpine",
    nationality: "French",
    flag: "🇫🇷",
    color: "#33b8f0",
    bio: "One of the sport's great comeback stories. Demoted from Red Bull mid-2019, won a Grand Prix months later. Emotional, fast, fiercely proud.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "1" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "5" },
    ],
    moment: {
      caption:
        "2020 Italian Grand Prix — The Monza race was chaos from the opening lap. Hamilton took a penalty, Kvyat crashed, Sainz retired — and suddenly Pierre Gasly, driving for the junior AlphaTauri team just over a year after being dropped by the senior Red Bull outfit in the most public fashion imaginable, found himself in the lead of a Formula 1 Grand Prix. He held it together through a safety car restart, repelled a charging McLaren in the closing laps, and crossed the line with tears streaming down his face. It was a victory that nobody expected, for a driver who had refused to disappear.",
      year: "2020",
    },
    eloRating: 984.6,
  },
  {
    id: "col",
    photoId: "francocolapinto",
    number: 43,
    name: "Franco Colapinto",
    short: "COL",
    team: "Alpine",
    nationality: "Argentine",
    flag: "🇦🇷",
    color: "#0079b0",
    bio: "Argentina's fastest in a generation. Colapinto turned heads with his Williams cameo in 2024 and earned his Alpine seat through sheer bravado and raw pace.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "0" },
    ],
    moment: {
      caption:
        "2024 Italian Grand Prix debut — Colapinto had roughly two weeks' notice. The seat had opened unexpectedly, the car was unfamiliar, the circuit is one of the fastest and most unforgiving on the calendar, and the whole of Argentina was watching. He qualified comfortably within the midfield, raced with the discipline of someone three years his senior, avoided every piece of drama that swirled around him, and brought the car home in the points. The paddock spent the next two days talking about him. By Baku, it was clear this was no accident.",
      year: "2024",
    },
    eloRating: 918.9,
  },
  {
    id: "oco",
    photoId: "estebanocon",
    number: 31,
    name: "Esteban Ocon",
    short: "OCO",
    team: "Haas F1 Team",
    nationality: "French",
    flag: "🇫🇷",
    color: "#eef0f1",
    bio: "Terrier-like ability to fight for position. His 2021 Hungarian GP win — against the odds — remains one of the most unexpected results of the decade. Now leading Haas.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "1" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "4" },
    ],
    moment: {
      caption:
        "2021 Hungarian Grand Prix — The first lap was carnage. Valtteri Bottas triggered a multi-car collision that wiped out half the front of the grid, and Ocon — having swerved through the debris in his Alpine — emerged in clean air at the front of the race. He pitted immediately under the red flag, rejoined on fresh tyres, and then spent the next 67 laps doing everything in his power to hold off Sebastian Vettel, who was charging through the field on the fastest car on track. Ocon was not supposed to win this race. He won it anyway, and stood on the top step of the podium with tears he made absolutely no attempt to hide.",
      year: "2021",
    },
    eloRating: 978.0,
  },
  {
    id: "bea",
    photoId: "oliverbearman",
    number: 87,
    name: "Oliver Bearman",
    short: "BEA",
    team: "Haas F1 Team",
    nationality: "British",
    flag: "🇬🇧",
    color: "#b0b4b6",
    bio: "The calmest teenager in the paddock. Bearman's Ferrari debut in Jeddah 2024 — scoring points immediately — was the most impressive one-off drive in years.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "0" },
    ],
    moment: {
      caption:
        "2024 Saudi Arabian Grand Prix — Carlos Sainz fell ill on the Thursday. Ferrari called their eighteen-year-old academy driver, who was scheduled to compete in the Formula 2 race that same weekend. Bearman had never driven the SF-24 in a race. He qualified eleventh, lost a place at the start, and then — completely unruffled — began picking his way through the field on a circuit that punishes the smallest mistake. He passed established grand prix winners, managed his tyres with the judgement of a veteran, and finished seventh. He climbed out of the car and asked when his Formula 2 race was.",
      year: "2024",
    },
    eloRating: 1020.5,
  },
  {
    id: "law",
    photoId: "liamlawson",
    number: 30,
    name: "Liam Lawson",
    short: "LAW",
    team: "Racing Bulls",
    nationality: "New Zealander",
    flag: "🇳🇿",
    color: "#88aaff",
    bio: "New Zealand's most exciting F1 export since Jones. Quick, combative, and completely fearless — Lawson punches above his weight wherever he races.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "0" },
    ],
    moment: {
      caption:
        "2023 Dutch and Italian Grands Prix — Daniel Ricciardo's hand injury left Red Bull needing a replacement at 72 hours' notice. Lawson had almost no Formula 1 testing to his name. At Zandvoort he out-qualified his more experienced substitute teammate and brought the car home cleanly. At Monza, a circuit where mistakes happen fast, he scored points on only his second ever Formula 1 weekend. Five races, zero errors, points on the board. Red Bull had seen enough. They had found their next driver.",
      year: "2023",
    },
    eloRating: 997.6,
  },
  {
    id: "lin",
    photoId: "arvidlindblad",
    number: 45,
    name: "Arvid Lindblad",
    short: "LIN",
    team: "Racing Bulls",
    nationality: "British",
    flag: "🇬🇧",
    color: "#4470e0",
    bio: "The youngest driver on the 2026 grid. The British-Swedish sensation won multiple junior titles with remarkable consistency before earning his Racing Bulls seat.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "0" },
    ],
    moment: {
      caption:
        "2025 Formula 2 Season — Lindblad did not win the Formula 2 title with a late-season surge or a rival's misfortune. He won it the way the best champions do: by making the season feel inevitable. Back-to-back sprint victories in the final rounds were merely the punctuation at the end of a year in which he had been consistently, relentlessly faster than everyone else. His car control in the rain, his tyre conservation in the heat, and his ability to extract performance from an understeering car earned him a reputation as the most technically complete junior driver Red Bull had ever assessed. Racing Bulls was never really in question.",
      year: "2025",
    },
    eloRating: 1005.3,
  },
  {
    id: "hul",
    photoId: "nicohulkenberg",
    number: 27,
    name: "Nico Hulkenberg",
    short: "HUL",
    team: "Audi",
    nationality: "German",
    flag: "🇩🇪",
    color: "#ff5533",
    bio: "The irony of zero F1 podiums despite 200+ starts makes Hulkenberg's story unique. Now leading Audi's ambitious works project into F1's new era.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "1" },
      { label: "Podiums", value: "1" },
    ],
    moment: {
      caption:
        "2025 British Grand Prix — Race 239. Nico Hulkenberg's career statistic — the most starts in Formula 1 history without a podium — had become both a running joke and a genuine source of pain for a driver who had always possessed the talent to deserve better machinery. At Silverstone, in front of a crowd that had long since adopted him as one of their own, he drove the Audi to third place. It wasn't a dramatic last-lap move or a chaotic race result. He earned it: consistent, measured, fast enough when it mattered. When he stood on that podium, the entire paddock applauded. The streak was over. It had taken far too long.",
      year: "2025",
    },
    eloRating: 989.8,
  },
  {
    id: "bor",
    photoId: "gabrielbortoleto",
    number: 5,
    name: "Gabriel Bortoleto",
    short: "BOR",
    team: "Audi",
    nationality: "Brazilian",
    flag: "🇧🇷",
    color: "#cc2200",
    bio: "The 2024 Formula 2 champion turned Audi factory driver. The Brazilian's composure and technical feedback skill are beyond his years — a future race winner.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "0" },
      { label: "Poles", value: "0" },
      { label: "Podiums", value: "0" },
    ],
    moment: {
      caption:
        "2024 Formula 2 Season — Bortoleto's Formula 2 title was defined not by moments of brilliance but by the total absence of bad ones. His rivals made mistakes; he simply did not. Races that should have been defeats he turned into damage-limitation exercises. Weekends that looked neutral he converted into points advantages. His debriefs with the engineering team were, by all accounts, extraordinarily detailed for a driver his age — a trait that caught Audi's attention as much as his lap times did. A manufacturer staking their entire Formula 1 project on a rookie needed someone with more than speed. They found exactly that.",
      year: "2024",
    },
    eloRating: 961.8,
  },
  {
    id: "per",
    photoId: "checoperez",
    number: 11,
    name: "Sergio Perez",
    short: "PER",
    team: "Cadillac",
    nationality: "Mexican",
    flag: "🇲🇽",
    color: "#c8c8cb",
    bio: "F1's greatest underdog story. A decade of midfield battles before Red Bull success. Now spearheading Cadillac's bold entry into Formula 1 alongside Bottas.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "6" },
      { label: "Poles", value: "3" },
      { label: "Podiums", value: "39" },
    ],
    moment: {
      caption:
        "2021 Azerbaijan Grand Prix — Baku rewards bravery and punishes error, and Perez delivered one of the finest controlled performances of his career. He qualified on the front row, managed the pressure of leading a grand prix for long stretches on one of the most unforgiving circuits on the calendar, and won cleanly — no safety car gift, no rival misfortune. Just Sergio Perez, executing a race strategy with the cool precision that had always been his greatest weapon. For a driver who had spent a decade being good enough to win and never having the car to do it, the moment was a long time coming.",
      year: "2021",
    },
    eloRating: 1088.4,
  },
  {
    id: "bot",
    photoId: "valterribottas",
    number: 77,
    name: "Valtteri Bottas",
    short: "BOT",
    team: "Cadillac",
    nationality: "Finnish",
    flag: "🇫🇮",
    color: "#7a7a7d",
    bio: "Ten years at the top is not an accident. Technically precise and a genuine team player — now bringing his experience to Cadillac's maiden F1 season.",
    stats: [
      { label: "WDC", value: "0" },
      { label: "Wins", value: "10" },
      { label: "Poles", value: "20" },
      { label: "Podiums", value: "67" },
    ],
    moment: {
      caption:
        "2019 Australian Grand Prix — Bottas had spent 2018 in Hamilton's shadow, second in the championship, second at race after race, quietly and painfully second. The curtain rose on 2019 at Melbourne, and from the moment the lights went out, Bottas was untouchable. He led from pole to flag, set the fastest lap, and took the bonus point for it — a maximum score, a statement of intent, a message to his teammate and to the entire field that the 2019 version of Valtteri Bottas had arrived with something to prove. He christened it himself on team radio: 'To whom it may concern — Valtteri 2.0.'",
      year: "2019",
    },
    eloRating: 896.6,
  },
];

// ─── DRIVER CARD ──────────────────────────────────────────────────────────────
function DriverCard({
  driver,
  selected,
  onClick,
}: {
  driver: Driver;
  selected: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const photoUrl = getAsset(PHOTOS, driver.photoId);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative rounded-xl cursor-none overflow-hidden transition-all duration-200"
      style={{
        background: "#161a1d",
        border: `1px solid ${selected ? driver.color : hov ? "rgba(124,152,158,0.35)" : "rgba(124,152,158,0.12)"}`,
        transform: selected
          ? "translateY(-4px)"
          : hov
            ? "translateY(-2px)"
            : "none",
        boxShadow: selected
          ? `0 10px 30px ${driver.color}44`
          : hov
            ? `0 4px 16px rgba(124,152,158,0.12)`
            : "none",
      }}
    >
      {/* Team colour stripe */}
      <div
        className="h-[5px] w-full tire-texture"
        style={{ background: selected ? driver.color : `${driver.color}88` }}
      />

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <span
            className="font-['Zen_Dots'] text-[32px] leading-none"
            style={{ color: selected ? driver.color : `${driver.color}55` }}
          >
            {driver.number}
          </span>
          <span className="text-xl">{driver.flag}</span>
        </div>

        {/* Driver photo */}
        <div
          className="w-full rounded-lg mb-2 overflow-hidden"
          style={{
            aspectRatio: "3/4",
            background: `${driver.color}10`,
            border: `1px solid ${driver.color}20`,
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={driver.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 10%" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="font-['Zen_Dots'] text-[36px]"
                style={{ color: `${driver.color}40` }}
              >
                {driver.short}
              </span>
            </div>
          )}
        </div>

        <div className="mb-2.5">
          <p className="font-['Alumni_Sans'] font-bold text-white text-[15px] leading-tight">
            {driver.name.split(" ")[0]}
          </p>
          <p
            className="font-['Alumni_Sans'] font-bold text-[15px] leading-tight"
            style={{ color: selected ? driver.color : "white" }}
          >
            {driver.name.split(" ").slice(1).join(" ")}
          </p>
        </div>

        <div
          className="h-px mb-2.5"
          style={{ background: `${driver.color}33` }}
        />
        <p className="font-['Alumni_Sans'] text-[11px] text-[#9FA0C3] truncate mb-0.5">
          {driver.team}
        </p>
        <p
          className="font-['Alumni_Sans'] text-[11px]"
          style={{ color: `${driver.color}99` }}
        >
          {driver.nationality}
        </p>

        <div
          className="mt-3 flex justify-between items-center rounded-md px-2 py-1.5"
          style={{
            background: selected
              ? `${driver.color}18`
              : "rgba(124,152,158,0.06)",
            border: `1px solid ${selected ? driver.color + "44" : "rgba(124,152,158,0.15)"}`,
          }}
        >
          <span className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-wide">
            ELO
          </span>
          <span
            className="font-['Zen_Dots'] text-[12px]"
            style={{ color: driver.color }}
          >
            {driver.eloRating.toFixed(1)}
          </span>
        </div>
      </div>

      {selected && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
          style={{
            background: driver.color,
            boxShadow: `0 0 10px ${driver.color}`,
          }}
        />
      )}
    </div>
  );
}

// ─── DRIVER DETAIL ────────────────────────────────────────────────────────────
function DriverDetail({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
  const momentUrl = getAsset(MOMENTS, driver.photoId);
  const photoUrl = getAsset(PHOTOS, driver.photoId);

  return (
    <div
      className="col-span-5 rounded-xl overflow-hidden border"
      style={{
        background: "linear-gradient(135deg,#111416 0%,#161a1d 100%)",
        borderColor: `${driver.color}55`,
      }}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-between px-6 py-5 tire-texture border-b overflow-hidden"
        style={{
          background: `linear-gradient(105deg,${driver.color}22 0%,${driver.color}08 100%)`,
          borderBottomColor: "rgba(124,152,158,0.12)",
        }}
      >
        <div className="absolute inset-0 diag-stripes opacity-40" />
        <div className="relative flex items-center gap-5">
          {/* Driver photo in header */}
          <div
            className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
            style={{
              background: `${driver.color}22`,
              border: `2px solid ${driver.color}`,
              boxShadow: `0 0 24px ${driver.color}44`,
            }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={driver.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-['Zen_Dots'] text-2xl"
                style={{ color: driver.color }}
              >
                {driver.number}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-['Zen_Dots'] text-2xl text-white font-normal leading-none">
              {driver.name}
            </h2>
            <p
              className="font-['Alumni_Sans'] text-[15px] mt-1"
              style={{ color: driver.color }}
            >
              {driver.team}
            </p>
          </div>
          <div
            className="ml-4 flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(124,152,158,0.2)",
            }}
          >
            <span className="text-xl">{driver.flag}</span>
            <span className="font-['Alumni_Sans'] text-[13px] text-[#9FA0C3]">
              {driver.nationality}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#9FA0C3] font-['Alumni_Sans'] text-xl cursor-none"
          style={{
            border: "1px solid rgba(124,152,158,0.25)",
            background: "transparent",
          }}
        >
          ×
        </button>
      </div>

      {/* Body — 3 columns */}
      <div className="grid grid-cols-3 divide-x divide-[rgba(124,152,158,0.08)]">
        {/* Bio + Stats */}
        <div className="p-5 flex flex-col gap-5 border-r border-[rgba(124,152,158,0.1)]">
          <div>
            <h3
              className="font-['Zen_Dots'] text-[12px] font-normal mb-2"
              style={{ color: driver.color }}
            >
              ◆ Biography
            </h3>
            <p className="font-['Alumni_Sans'] text-[16px] text-[#9FA0C3] leading-relaxed">
              {driver.bio}
            </p>
          </div>
          <div>
            <h3
              className="font-['Zen_Dots'] text-[12px] font-normal mb-3"
              style={{ color: driver.color }}
            >
              ◆ Career Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {driver.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: `${driver.color}0f`,
                    border: `1px solid ${driver.color}22`,
                  }}
                >
                  <p
                    className="font-['Alumni_Sans_Inline_One'] text-[22px] leading-none mb-0.5"
                    style={{ color: driver.color }}
                  >
                    {s.value}
                  </p>
                  <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-wide">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The Moment */}
        <div className="p-5 flex flex-col gap-4 border-r border-[rgba(124,152,158,0.1)]">
          <h3
            className="font-['Zen_Dots'] text-[12px] font-normal"
            style={{ color: "#7C989E" }}
          >
            ◆ The Moment
          </h3>
          <div
            className="w-full rounded-xl overflow-hidden relative"
            style={{
              aspectRatio: "16/9",
              background: `linear-gradient(135deg,${driver.color}18 0%,rgba(8,10,11,0.8) 100%)`,
              border: `1px solid ${driver.color}33`,
            }}
          >
            {momentUrl ? (
              <img
                src={momentUrl}
                alt="key moment"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 carbon-hex" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <span
                    className="font-['Zen_Dots'] text-[56px] leading-none"
                    style={{ color: `${driver.color}30` }}
                  >
                    {driver.number}
                  </span>
                  <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] text-center px-4">
                    Add image: src/assets/driverbio_moments/{driver.id}.jpg
                  </p>
                </div>
              </>
            )}
            <div
              className="absolute top-3 right-3 font-['Zen_Dots'] text-xs px-2 py-0.5 rounded"
              style={{
                background: `${driver.color}55`,
                border: `1px solid ${driver.color}77`,
                color: "#fff",
              }}
            >
              {driver.moment.year}
            </div>
          </div>
          <div
            className="rounded-lg p-4 border-l-[3px] overflow-y-auto"
            style={{
              background: "rgba(28,33,36,0.8)",
              borderLeftColor: driver.color,
              maxHeight: 160,
            }}
          >
            <p className="font-['Alumni_Sans'] text-[13px] text-[#d1d5dc] leading-relaxed italic">
              "{driver.moment.caption}"
            </p>
          </div>
        </div>

        {/* ELO Rating */}
        <div className="p-5 flex flex-col gap-4">
          <h3
            className="font-['Zen_Dots'] text-[12px] font-normal"
            style={{ color: "#9FA0C3" }}
          >
            ◆ ELO Rating
          </h3>
          <div
            className="rounded-xl p-5 text-center"
            style={{
              background: `${driver.color}0f`,
              border: `1px solid ${driver.color}33`,
            }}
          >
            <p className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-[2px] mb-1">
              Career Rating
            </p>
            <p
              className="font-['Alumni_Sans_Inline_One'] text-[48px] leading-none mb-1.5"
              style={{
                color: driver.color,
                textShadow: `0 0 30px ${driver.color}55`,
              }}
            >
              {driver.eloRating.toFixed(1)}
            </p>
            <p className="font-['Alumni_Sans'] text-[12px] text-[#748386]">
              Based on all career races since 1994
            </p>
          </div>
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(28,33,36,0.7)",
              border: "1px solid rgba(124,152,158,0.1)",
            }}
          >
            <p className="font-['Alumni_Sans'] text-[11px] text-[#748386] uppercase tracking-wide mb-2">
              How it's calculated
            </p>
            <p className="font-['Alumni_Sans'] text-[12px] text-[#9FA0C3] leading-relaxed">
              Each race updates this driver's rating by{" "}
              <span
                style={{
                  color: driver.color,
                  fontFamily: "'Zen Dots', sans-serif",
                  fontSize: 11,
                }}
              >
                K × (S − E)
              </span>
              , where K weights the importance of the race by championship
              standings pressure, S is the fraction of the field beaten, and E
              is the expected score based on relative ratings entering the race.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Drivers() {
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("open"),
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!searchParams.get("open")) return;
    const timer = setTimeout(() => {
      document
        .querySelector("[data-driver-drawer]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = DRIVERS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.team.toLowerCase().includes(search.toLowerCase()) ||
      d.nationality.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => b.eloRating - a.eloRating);
  const selectedDriver = DRIVERS.find((d) => d.id === selectedId) ?? null;
  const rows: Driver[][] = [];
  for (let i = 0; i < filtered.length; i += 5)
    rows.push(filtered.slice(i, i + 5));
  const selectedRowIdx = selectedDriver
    ? Math.floor(filtered.findIndex((d) => d.id === selectedId) / 5)
    : -1;

  return (
    <div className={PAGE}>
      <DRSSweep delay={80} />

      {/* Header */}
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
              2026 Season Grid
            </p>
            <h1 className="font-['Zen_Dots'] text-[32px] text-white font-normal">
              Drivers
            </h1>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search driver, team or nationality…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedId(null);
              }}
              className="font-['Alumni_Sans'] text-[13px] text-white placeholder:text-[#748386] outline-none rounded-lg py-2 pl-9 pr-4"
              style={{
                width: 300,
                background: "rgba(22,26,29,0.9)",
                border: "1px solid rgba(124,152,158,0.25)",
              }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748386] text-sm">
              🔍
            </span>
          </div>
        </div>
      </div>

      <div className={INNER}>
        <SectionDivider variant="sector" label="Driver Profiles" />
        <div className="flex flex-col gap-3">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-col gap-3">
              {rowIdx === rows.length - 1 && row.length < 5 ? (
                <div className="flex gap-3 justify-center">
                  {row.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        flex: "0 0 calc(20% - 10px)",
                        maxWidth: "calc(20% - 10px)",
                      }}
                    >
                      <DriverCard
                        driver={d}
                        selected={selectedId === d.id}
                        onClick={() =>
                          setSelectedId((prev) => (prev === d.id ? null : d.id))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {row.map((d) => (
                    <DriverCard
                      key={d.id}
                      driver={d}
                      selected={selectedId === d.id}
                      onClick={() =>
                        setSelectedId((prev) => (prev === d.id ? null : d.id))
                      }
                    />
                  ))}
                </div>
              )}
              {selectedDriver && rowIdx === selectedRowIdx && (
                <div
                  data-driver-drawer
                  style={{ animation: "detail-slide-in 0.25s ease" }}
                >
                  <style>{`@keyframes detail-slide-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  <DriverDetail
                    driver={selectedDriver}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
