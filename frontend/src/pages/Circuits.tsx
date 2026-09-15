/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CIRCUITS — src/pages/Circuits.tsx
 * Route: /circuits
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Database of all 24 Formula 1 circuits with historical profiles.
 * Cards arranged in a 3-column grid; clicking a card opens an inline drawer
 * below that row with a full description, circuit stats, and track record.
 *
 * ─── BACKEND API ENDPOINTS NEEDED ────────────────────────────────────────────
 *  GET /api/circuits?season=2026  → Circuit[]  (replace ALL_CIRCUITS)
 *  GET /api/circuits/:id          → Circuit    (replace find() lookup)
 */

import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAGE, INNER, H1, H2, META } from '../components/layout'
import DRSSweep from '../components/DRSSweep'
import SectionDivider from '../components/SectionDivider'

// ─── CIRCUIT IMAGE IMPORTS ────────────────────────────────────────────────────
import australiaImg   from '../assets/img/circuit_logos/australia.png'
import bahrainImg     from '../assets/img/circuit_logos/bahrain.png'
import jeddahImg      from '../assets/img/circuit_logos/jeddah.png'
import japanImg       from '../assets/img/circuit_logos/japan.png'
import chinaImg       from '../assets/img/circuit_logos/china.png'
import miamiImg       from '../assets/img/circuit_logos/miami.png'
import imolaImg       from '../assets/img/circuit_logos/imola.png'
import monacoImg      from '../assets/img/circuit_logos/monaco.png'
import spainImg       from '../assets/img/circuit_logos/spain.png'
import canadaImg      from '../assets/img/circuit_logos/canada.png'
import austriaImg     from '../assets/img/circuit_logos/austria.png'
import silverstoneImg from '../assets/img/circuit_logos/silverstone.png'
import hungaryImg     from '../assets/img/circuit_logos/hungary.png'
import spaImg         from '../assets/img/circuit_logos/spa.png'
import zandvoortImg   from '../assets/img/circuit_logos/zandvoort.png'
import monzaImg       from '../assets/img/circuit_logos/monza.png'
import bakuImg        from '../assets/img/circuit_logos/baku.png'
import singaporeImg   from '../assets/img/circuit_logos/singapore.png'
import austinImg      from '../assets/img/circuit_logos/austin.png'
import mexicoImg      from '../assets/img/circuit_logos/mexico.png'
import interlagosImg  from '../assets/img/circuit_logos/interlagos.png'
import lasvegasImg    from '../assets/img/circuit_logos/lasvegas.png'
import qatarImg       from '../assets/img/circuit_logos/qatar.png'
import abudhabiImg    from '../assets/img/circuit_logos/abudhabi.png'

type Difficulty = 'High' | 'Medium' | 'Low'

interface Circuit {
  id:                   string
  name:                 string
  fullName:             string
  country:              string
  flag:                 string
  length:               string
  laps:                 number
  lapRecord:            string
  lapRecordHolder:      string
  lapRecordHolderId?:   string   // set only for current 2026 grid drivers
  lapRecordYear:        number
  timesHeld:            number
  firstHeld:            number
  mostWinsDriver:       string
  mostWinsDriverId?:    string   // set only for current 2026 grid drivers
  overtakingDifficulty: Difficulty
  description:          string
}

const ALL_CIRCUITS: Circuit[] = [
  {
    id: 'australia', name: 'Australia', fullName: 'Albert Park Circuit', country: 'Australia', flag: '🇦🇺',
    length: '5.278 km', laps: 58,
    lapRecord: '1:19.813', lapRecordHolder: 'C. Leclerc', lapRecordHolderId: 'lec', lapRecordYear: 2022,
    timesHeld: 29, firstHeld: 1996, mostWinsDriver: 'M. Schumacher (4)', overtakingDifficulty: 'Medium',
    description: 'The Albert Park Circuit weaves through Melbourne\'s parkland on temporary roads laid around a public lake, creating a flowing anti-clockwise layout that rewards smooth, committed driving. Its combination of fast sweeping sections and tight braking zones means engineers must find a careful aerodynamic compromise, while the relatively green surface at the start of the season catches teams and tyres off guard. As the traditional season opener, it carries a unique atmosphere of anticipation, with the first race often delivering unpredictable results that set the tone for the championship battle ahead.',
  },
  {
    id: 'bahrain', name: 'Bahrain', fullName: 'Bahrain International Circuit', country: 'Bahrain', flag: '🇧🇭',
    length: '5.412 km', laps: 57,
    lapRecord: '1:31.447', lapRecordHolder: 'P. de la Rosa', lapRecordYear: 2005,
    timesHeld: 21, firstHeld: 2004, mostWinsDriver: 'L. Hamilton (5)', mostWinsDriverId: 'ham', overtakingDifficulty: 'Low',
    description: 'Set in the Sakhir Desert, the Bahrain International Circuit is a permanent facility built on reclaimed desert land that presents drivers with a punishing combination of slow-speed hairpins, extended traction zones, and abrasive asphalt that destroys tyres at an alarming rate. The race is held after dark under powerful floodlights, which creates a dramatic visual spectacle while also bringing cooler air temperatures that shift the handling balance and compound strategy for every team. Its position on the calendar as an early-season round means it often serves as the first true benchmark for where each constructor stands, with tyre degradation frequently separating genuine title contenders from pretenders.',
  },
  {
    id: 'jeddah', name: 'Saudi Arabia', fullName: 'Jeddah Corniche Circuit', country: 'Saudi Arabia', flag: '🇸🇦',
    length: '6.174 km', laps: 50,
    lapRecord: '1:30.734', lapRecordHolder: 'L. Hamilton', lapRecordHolderId: 'ham', lapRecordYear: 2021,
    timesHeld: 4, firstHeld: 2021, mostWinsDriver: 'M. Verstappen (3)', mostWinsDriverId: 'ver', overtakingDifficulty: 'Medium',
    description: 'The Jeddah Corniche Circuit runs along Saudi Arabia\'s Red Sea coast as one of the fastest street circuits ever conceived, with average lap speeds rivalling even Monza thanks to a succession of high-speed sweepers where cars carry extraordinary velocity mere centimetres from concrete barriers. With 27 corners and almost no meaningful run-off, the margin for error is effectively zero, and the limited visibility through several blind crests and bends means drivers are operating almost entirely on memory and feel. Safety car periods are statistically near-certain here, making race management and the ability to react rapidly to changing circumstances just as important as raw pace.',
  },
  {
    id: 'japan', name: 'Japan', fullName: 'Suzuka International Racing Course', country: 'Japan', flag: '🇯🇵',
    length: '5.807 km', laps: 53,
    lapRecord: '1:30.983', lapRecordHolder: 'L. Hamilton', lapRecordHolderId: 'ham', lapRecordYear: 2019,
    timesHeld: 37, firstHeld: 1987, mostWinsDriver: 'M. Schumacher (6)', overtakingDifficulty: 'High',
    description: 'Suzuka is widely regarded by drivers, engineers, and fans alike as the greatest circuit on the Formula 1 calendar, a status earned through its unique figure-of-eight layout, relentless variety, and an atmosphere unlike any other venue in the sport. The opening sector demands maximum commitment through the Esses, where drivers take a succession of ultra-high-speed direction changes at close to 250 km/h on a road that punishes any deviation from the ideal line with an immediate visit to the barriers. The 130R corner in the final sector represents perhaps the single most demanding commitment in modern F1, requiring drivers to hold full throttle through a left-hander that generates enormous lateral forces, while the Spoon Curve and the sweeping Degner esses test every aspect of chassis balance and driver bravery across the lap.',
  },
  {
    id: 'china', name: 'China', fullName: 'Shanghai International Circuit', country: 'China', flag: '🇨🇳',
    length: '5.451 km', laps: 56,
    lapRecord: '1:32.238', lapRecordHolder: 'M. Schumacher', lapRecordYear: 2004,
    timesHeld: 19, firstHeld: 2004, mostWinsDriver: 'L. Hamilton (6)', mostWinsDriverId: 'ham', overtakingDifficulty: 'Medium',
    description: 'The Shanghai International Circuit was purpose-built as a showpiece venue and features a distinctive snail-shaped turn complex at its opening that generates some of the longest braking zones of the season, followed by a long sweeping sequence that punishes understeer and demands exceptional rear-end stability. High tyre degradation is a signature characteristic of the Chinese Grand Prix, driven by the abrasive asphalt and the sustained lateral loads through the track\'s many long-radius corners that scrub rubber from the tyres over successive laps. After a period of absence from the calendar, its return was eagerly anticipated, and the wide pit straight offers genuine overtaking opportunities that keep strategic variation alive deep into the race.',
  },
  {
    id: 'miami', name: 'Miami', fullName: 'Miami International Autodrome', country: 'USA', flag: '🇺🇸',
    length: '5.412 km', laps: 57,
    lapRecord: '1:29.708', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2023,
    timesHeld: 3, firstHeld: 2022, mostWinsDriver: 'M. Verstappen (2)', mostWinsDriverId: 'ver', overtakingDifficulty: 'Medium',
    description: 'The Miami International Autodrome encircles the Hard Rock Stadium in a street-style layout that blends flowing medium-speed sequences with heavy braking zones, all under the intense heat of a Florida spring weekend that pushes car and driver cooling systems to their absolute limits. Despite its young age on the calendar, Miami has already produced eventful races shaped by the relentless tyre thermal degradation that the track\'s abrasive surface and extreme track temperatures generate, forcing teams into complex multi-stop strategies. The event has quickly become one of the most commercially glamorous on the calendar, drawing enormous celebrity attention while the circuit itself continues to evolve in character as rubber builds up across successive race weekends.',
  },
  {
    id: 'imola', name: 'Emilia Romagna', fullName: 'Autodromo Enzo e Dino Ferrari', country: 'Italy', flag: '🇮🇹',
    length: '4.909 km', laps: 63,
    lapRecord: '1:15.484', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2022,
    timesHeld: 28, firstHeld: 1980, mostWinsDriver: 'M. Schumacher (7)', overtakingDifficulty: 'High',
    description: 'Imola is one of the most storied venues in motorsport history, a narrow, undulating circuit cut through the hills of Emilia-Romagna that has hosted some of the most significant moments in Formula 1 across four decades of racing. The circuit offers virtually no overtaking opportunities around its lap, meaning qualifying performance and the ability to manage tyres in clean air are far more decisive than raw race pace, making every strategy decision carry enormous weight. The track demands a car with outstanding mechanical balance and downforce, punishing any instability through the Tamburello and Villeneuve chicanes where the barriers are immediately unforgiving, carrying a weight of history that makes it a deeply emotional venue for all within the sport.',
  },
  {
    id: 'monaco', name: 'Monaco', fullName: 'Circuit de Monaco', country: 'Monaco', flag: '🇲🇨',
    length: '3.337 km', laps: 78,
    lapRecord: '1:12.909', lapRecordHolder: 'L. Hamilton', lapRecordHolderId: 'ham', lapRecordYear: 2021,
    timesHeld: 70, firstHeld: 1950, mostWinsDriver: 'A. Senna (6)', overtakingDifficulty: 'High',
    description: 'Monaco is the jewel of the Formula 1 crown, a circuit that has threaded through the streets of the principality since the very first World Championship season and has never surrendered its status as the most prestigious and demanding event on the calendar. The track passes through narrow tunnels, brushes armco barriers with inches to spare, and plunges down steep gradients where the commitment required at Massenet or through the Swimming Pool complex is unlike anything drivers experience elsewhere. Overtaking is nearly impossible around the lap, which concentrates enormous pressure onto qualifying and the first stint decision-making, as track position is almost always definitive — a fact that makes the Monaco Grand Prix as much a test of nerve and strategy as it is of pure driving ability.',
  },
  {
    id: 'spain', name: 'Spain', fullName: 'Circuit de Barcelona-Catalunya', country: 'Spain', flag: '🇪🇸',
    length: '4.657 km', laps: 66,
    lapRecord: '1:16.330', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2023,
    timesHeld: 34, firstHeld: 1991, mostWinsDriver: 'M. Schumacher (6)', overtakingDifficulty: 'Medium',
    description: 'Barcelona-Catalunya is the circuit that knows Formula 1 more intimately than almost any other venue in the world, having hosted winter testing for decades and serving as the benchmark against which every car\'s development is measured. Its layout covers every type of corner a driver will encounter during the season, from the long-radius Turn 3 sweep that loads the front tyres relentlessly, to the tight hairpin at Turn 10 and the technical chicane at Turn 14 that rewards mechanical grip and balance. Tyre degradation is consistently severe here, particularly on the rear axle, and the ability to manage compound wear while maintaining race pace is typically the defining factor separating the top finishers from the rest of the field.',
  },
  {
    id: 'canada', name: 'Canada', fullName: 'Circuit Gilles Villeneuve', country: 'Canada', flag: '🇨🇦',
    length: '4.361 km', laps: 70,
    lapRecord: '1:13.078', lapRecordHolder: 'V. Bottas', lapRecordHolderId: 'bot', lapRecordYear: 2019,
    timesHeld: 45, firstHeld: 1967, mostWinsDriver: 'M. Schumacher (7)', overtakingDifficulty: 'Low',
    description: 'The Circuit Gilles Villeneuve on the man-made Ile Notre-Dame is a semi-permanent circuit that combines long acceleration zones and heavy braking areas with a tight and unforgiving collection of chicanes and hairpins that make it one of the most brake-intensive venues of the season. The legendary Wall of Champions at the final chicane has claimed more high-profile victims than any other single corner in the sport, ending races for championship leaders who arrived with too much confidence and insufficient caution. Montreal is a circuit where safety car periods are routine, where fuel strategy and brake management define the outcome as much as aerodynamic setup, and where the passionate Canadian crowd and a distinctly festive city atmosphere make it one of the most beloved events on the entire calendar.',
  },
  {
    id: 'austria', name: 'Austria', fullName: 'Red Bull Ring', country: 'Austria', flag: '🇦🇹',
    length: '4.318 km', laps: 71,
    lapRecord: '1:05.619', lapRecordHolder: 'C. Sainz', lapRecordHolderId: 'sai', lapRecordYear: 2020,
    timesHeld: 34, firstHeld: 1970, mostWinsDriver: 'M. Verstappen (4)', mostWinsDriverId: 'ver', overtakingDifficulty: 'Low',
    description: 'The Red Bull Ring in the Styrian Alps is among the shortest circuits on the Formula 1 calendar but compensates with dramatic elevation changes and an uncompromising power-dependent character that rewards cars with strong straight-line speed across its three prominent DRS detection zones. The uphill braking zone into Turn 1 is one of the most treacherous in the sport, with significant variations in grip level depending on track position and compound age, while Turn 3 is a high-speed right-hander where aerodynamic balance is absolutely critical. Set against the backdrop of green Alpine hills and frequently dramatic weather, the Austrian Grand Prix has delivered some of the most electrifying finishes in recent memory, particularly during the era of back-to-back sprint weekends that compressed an entire race weekend\'s drama into just three days.',
  },
  {
    id: 'silverstone', name: 'Great Britain', fullName: 'Silverstone Circuit', country: 'Great Britain', flag: '🇬🇧',
    length: '5.891 km', laps: 52,
    lapRecord: '1:27.097', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2020,
    timesHeld: 74, firstHeld: 1950, mostWinsDriver: 'L. Hamilton (8)', mostWinsDriverId: 'ham', overtakingDifficulty: 'Medium',
    description: 'Silverstone holds a unique place in Formula 1 history as the venue of the very first World Championship Grand Prix in 1950, and seven decades later it remains the sport\'s spiritual home, a circuit that draws the largest crowd of the season and generates a level of atmosphere that few venues in any sport can match. The Maggotts-Becketts-Chapel complex in the middle sector is the most demanding sustained sequence of high-speed direction changes in the championship, where drivers flick through a succession of corners at over 280 km/h with millimetres of clearance between their tyres and the kerbs. Copse corner and the sweeping Club corner that launches cars onto the main straight require exceptional aerodynamic commitment, and the famous unpredictability of British summer weather means that tyre selection and timing can transform a race outcome in the space of a single slow lap.',
  },
  {
    id: 'hungary', name: 'Hungary', fullName: 'Hungaroring', country: 'Hungary', flag: '🇭🇺',
    length: '4.381 km', laps: 70,
    lapRecord: '1:16.627', lapRecordHolder: 'L. Hamilton', lapRecordHolderId: 'ham', lapRecordYear: 2020,
    timesHeld: 39, firstHeld: 1986, mostWinsDriver: 'L. Hamilton (8)', mostWinsDriverId: 'ham', overtakingDifficulty: 'High',
    description: 'The Hungaroring has earned the nickname "the Monaco of the east" for its relentlessly twisting and narrow layout that makes overtaking during the race virtually impossible without a decisive performance or strategy advantage, placing an enormous premium on qualifying pace and the ability to control a race from the front. Situated in a natural amphitheatre outside Budapest, the circuit holds heat exceptionally well and consistently generates the highest track temperatures of the season, creating brutal tyre thermal degradation that forces teams into multi-stop strategies even when the degradation rate would otherwise suggest otherwise. The slow-speed character of the lap demands high levels of mechanical grip and downforce, rewarding cars with excellent balance through low-speed corners and penalising those that struggle with rear instability through the long sweeping Turn 12 that loads the tyres for an extended period.',
  },
  {
    id: 'spa', name: 'Belgium', fullName: 'Circuit de Spa-Francorchamps', country: 'Belgium', flag: '🇧🇪',
    length: '7.004 km', laps: 44,
    lapRecord: '1:46.286', lapRecordHolder: 'V. Bottas', lapRecordHolderId: 'bot', lapRecordYear: 2018,
    timesHeld: 66, firstHeld: 1950, mostWinsDriver: 'M. Schumacher (6)', overtakingDifficulty: 'Low',
    description: 'Spa-Francorchamps is, by an overwhelming consensus of drivers past and present, the greatest racing circuit on earth — a 7-kilometre journey through the forests of the Belgian Ardennes that compresses every type of corner and every form of challenge into a single breathtaking lap. The Eau Rouge-Raidillon combination at the foot and crest of the circuit\'s central valley is the most iconic corner complex in motorsport, a full-throttle compression and blind crest at over 300 km/h that separates those who commit entirely from those who do not. The circuit\'s unique microclimate means that conditions can vary dramatically from one end of the lap to the other, with sunshine at La Source and heavy rain through Pouhon occurring simultaneously, a characteristic that has produced some of the most dramatic and controversial moments in Formula 1 history.',
  },
  {
    id: 'zandvoort', name: 'Netherlands', fullName: 'Circuit Zandvoort', country: 'Netherlands', flag: '🇳🇱',
    length: '4.259 km', laps: 72,
    lapRecord: '1:11.097', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2021,
    timesHeld: 33, firstHeld: 1952, mostWinsDriver: 'M. Verstappen (3)', mostWinsDriverId: 'ver', overtakingDifficulty: 'High',
    description: 'Zandvoort returned to the Formula 1 calendar in 2021 after a 36-year absence and immediately announced itself as one of the most distinctive venues in the modern championship, a compact and physically demanding circuit set among the North Sea sand dunes where two heavily banked corners create a driving experience unlike anything else drivers encounter through the season. The bankings at Hugenholtz and the final Arie Luyendyk corner allow cars to carry far greater speed than a flat circuit would permit, shifting the aerodynamic and mechanical demands significantly and creating a unique challenge for setup engineers. Overtaking around the lap is extremely difficult given the track width and the limited straight lengths, which concentrates race outcomes on qualifying position, pit stop execution, and the ability to manage tyre performance while defending from faster cars immediately behind.',
  },
  {
    id: 'monza', name: 'Italy', fullName: 'Autodromo Nazionale Monza', country: 'Italy', flag: '🇮🇹',
    length: '5.793 km', laps: 53,
    lapRecord: '1:21.046', lapRecordHolder: 'R. Barrichello', lapRecordYear: 2004,
    timesHeld: 74, firstHeld: 1950, mostWinsDriver: 'M. Schumacher (5)', overtakingDifficulty: 'Low',
    description: 'The Temple of Speed at Monza has hosted the Italian Grand Prix in every season of the Formula 1 World Championship and is a venue of profound historical and emotional significance, particularly for the Tifosi who flood the grandstands in their thousands to create an atmosphere of extraordinary passion and noise. Teams run the lowest downforce levels of the season here to maximise straight-line speed, which transforms the aerodynamic character of the cars entirely and demands exceptional engine performance across the three long straights that connect the circuit\'s minimal collection of chicanes and the sweeping Parabolica final corner. The slipstream effect on the main straight is so pronounced that the final lap of qualifying frequently produces a tactical game of cat and mouse as drivers attempt to time their exit from the pits to find a perfect tow while avoiding becoming a mobile chicane for rivals.',
  },
  {
    id: 'baku', name: 'Azerbaijan', fullName: 'Baku City Circuit', country: 'Azerbaijan', flag: '🇦🇿',
    length: '6.003 km', laps: 51,
    lapRecord: '1:43.009', lapRecordHolder: 'C. Leclerc', lapRecordHolderId: 'lec', lapRecordYear: 2019,
    timesHeld: 9, firstHeld: 2016, mostWinsDriver: 'S. Perez (3)', mostWinsDriverId: 'per', overtakingDifficulty: 'Low',
    description: 'The Baku City Circuit is one of the most unpredictable venues in Formula 1, a circuit that combines a 2.2-kilometre flat-out blast down the pit straight with an impossibly narrow passage through the ancient city walls where the track width shrinks to just seven and a half metres, demanding extraordinary precision at speed. The contrast between the wide, high-speed opening sections and the claustrophobic castle sector creates a setup challenge that no single configuration can fully resolve, leading to inevitable compromise that rewards teams able to find balance across wildly different demands. Safety car periods at Baku are statistically near-certain, and the combination of a short lap, long straight, and competitive DRS effect means that a single late virtual safety car or re-start can completely invert the race classification and produce results that few could have anticipated when the lights went out.',
  },
  {
    id: 'singapore', name: 'Singapore', fullName: 'Marina Bay Street Circuit', country: 'Singapore', flag: '🇸🇬',
    length: '4.940 km', laps: 62,
    lapRecord: '1:35.867', lapRecordHolder: 'K. Raikkonen', lapRecordYear: 2018,
    timesHeld: 17, firstHeld: 2008, mostWinsDriver: 'S. Vettel (5)', overtakingDifficulty: 'High',
    description: 'The Singapore Grand Prix is the only fully nocturnal race on the Formula 1 calendar, run under 1,500 floodlights that bathe the Marina Bay street circuit in brilliant illumination while temperatures and humidity remain oppressively high even long after midnight, creating one of the most physically demanding race environments for drivers in the entire sport. The circuit winds through the financial district and past some of the city\'s most spectacular landmarks, demanding complete concentration across 62 laps on a layout where the barriers are an ever-present threat through its nineteen corners and multiple chicane sequences. Tyre management, fuel strategy, and safety car exploitation are crucial here, as the high temperatures prevent tyres from cooling adequately during any extended safety car period and the narrow track makes passing in clear air almost as difficult as it is in traffic.',
  },
  {
    id: 'austin', name: 'United States', fullName: 'Circuit of the Americas', country: 'USA', flag: '🇺🇸',
    length: '5.513 km', laps: 56,
    lapRecord: '1:36.169', lapRecordHolder: 'C. Leclerc', lapRecordHolderId: 'lec', lapRecordYear: 2019,
    timesHeld: 13, firstHeld: 2012, mostWinsDriver: 'L. Hamilton (6)', mostWinsDriverId: 'ham', overtakingDifficulty: 'Medium',
    description: 'The Circuit of the Americas was purpose-built to international Formula 1 specifications and drew deliberate inspiration from the world\'s most celebrated venues, incorporating elements reminiscent of Maggotts-Becketts, Eau Rouge, and the Esses at Suzuka to create a circuit that manages to feel both entirely new and immediately recognisable to any serious student of the sport. The dramatic uphill run to Turn 1 after a long flat-out approach from the start line is one of the most arresting visual moments in Formula 1, while the flowing back sector tests sustained cornering commitment through the long left-hander at Turn 12 and the extended sweeper at Turn 16. Tyre degradation at Austin can vary significantly depending on track temperatures, which fluctuate considerably over the October weekend, and the circuit\'s wide racing surface generally allows cars to follow more closely than at many venues, producing competitive and tactical racing across three different tyre compounds.',
  },
  {
    id: 'mexico', name: 'Mexico City', fullName: 'Autodromo Hermanos Rodriguez', country: 'Mexico', flag: '🇲🇽',
    length: '4.304 km', laps: 71,
    lapRecord: '1:17.774', lapRecordHolder: 'V. Bottas', lapRecordHolderId: 'bot', lapRecordYear: 2021,
    timesHeld: 29, firstHeld: 1963, mostWinsDriver: 'M. Verstappen (4)', mostWinsDriverId: 'ver', overtakingDifficulty: 'Low',
    description: 'Mexico City sits at an altitude of 2,285 metres above sea level, making the Autodromo Hermanos Rodriguez the most demanding venue on the calendar from an aerodynamic and power unit perspective, as the thin air reduces both engine output and aerodynamic downforce by approximately twenty percent compared to sea-level circuits, fundamentally altering how cars must be set up and driven. Teams compensate by running significantly higher downforce levels than the raw straight-line speed might otherwise suggest, and the power unit efficiency numbers that appear at altitude are deeply unrepresentative of how engines actually perform, creating unusual strategic considerations around overtaking and tyre compound selection. The stadium section through the baseball ground of Foro Sol provides one of the most uniquely atmospheric moments in the sport, with 130,000 passionate Mexican fans surrounding the cars as they thread through a tight chicane just metres from the concrete boundaries of the arena.',
  },
  {
    id: 'interlagos', name: 'Brazil', fullName: 'Autodromo Jose Carlos Pace', country: 'Brazil', flag: '🇧🇷',
    length: '4.309 km', laps: 71,
    lapRecord: '1:10.540', lapRecordHolder: 'V. Bottas', lapRecordHolderId: 'bot', lapRecordYear: 2018,
    timesHeld: 47, firstHeld: 1973, mostWinsDriver: 'M. Schumacher (4)', overtakingDifficulty: 'Low',
    description: 'Interlagos is an anti-clockwise circuit with an undulating, old-school character that has hosted some of the most dramatic and emotionally significant moments in Formula 1 history, including championship deciders that have been settled in the final metres of the final lap. The Senna S at the circuit entrance demands total commitment over its blind crest, while the long back straight through the Descida do Lago and the heavy braking into the final Juncao hairpin create repeated overtaking opportunities that other circuits can only envy. The tropical climate at the circuit\'s elevated position south of the city centre means weather can change dramatically and rapidly across a single afternoon, and the combination of a volatile track surface, passionate local crowd, and the historical weight of decades of championship defining races makes Interlagos one of the most emotionally charged venues on the entire Formula 1 calendar.',
  },
  {
    id: 'lasvegas', name: 'Las Vegas', fullName: 'Las Vegas Strip Circuit', country: 'USA', flag: '🇺🇸',
    length: '6.201 km', laps: 50,
    lapRecord: '1:35.490', lapRecordHolder: 'O. Piastri', lapRecordHolderId: 'pia', lapRecordYear: 2024,
    timesHeld: 2, firstHeld: 2023, mostWinsDriver: 'Tied — 1 win each', overtakingDifficulty: 'Low',
    description: 'The Las Vegas Strip Circuit runs through the most famous stretch of road in North America under artificial light against an extraordinary backdrop of casino hotels and neon signs, creating one of the most visually spectacular settings in the history of Formula 1. The circuit is run late at night in desert winter conditions where track temperatures can drop to single figures, creating a demanding tyre warm-up challenge that fundamentally changes the strategies available to teams and tests the physical setup and compound selection in ways that no other event replicates. The long Koval straight allows cars to reach speeds approaching 340 km/h before the heavy braking zones that punctuate the lap, and while the circuit is still establishing its character after just a handful of editions, it has already attracted enormous global interest and commercial significance as Formula 1\'s most extravagant single-race event.',
  },
  {
    id: 'qatar', name: 'Qatar', fullName: 'Lusail International Circuit', country: 'Qatar', flag: '🇶🇦',
    length: '5.380 km', laps: 57,
    lapRecord: '1:24.319', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2023,
    timesHeld: 4, firstHeld: 2021, mostWinsDriver: 'M. Verstappen (2)', mostWinsDriverId: 'ver', overtakingDifficulty: 'Medium',
    description: 'The Lusail International Circuit is a flowing, high-speed track originally designed for MotoGP motorcycle racing that has adapted remarkably well to Formula 1, rewarding cars with exceptional aerodynamic balance and the ability to sustain high lateral loads through its long radius corners without compromising tyre temperatures. Run under floodlights in the warm desert evening, the circuit generates some of the most severe tyre degradation of the season, a consequence of the sustained high-speed corner loads that build heat in the compounds at a rate that overwhelms even the most carefully managed strategies. The combination of smooth asphalt, high-speed layout, and extreme thermal degradation creates a race that frequently ends with front-running drivers on dramatically different compounds to their starting selection, with the winning strategy rarely apparent until the final quarter of the race.',
  },
  {
    id: 'abudhabi', name: 'Abu Dhabi', fullName: 'Yas Marina Circuit', country: 'UAE', flag: '🇦🇪',
    length: '5.281 km', laps: 58,
    lapRecord: '1:26.103', lapRecordHolder: 'M. Verstappen', lapRecordHolderId: 'ver', lapRecordYear: 2021,
    timesHeld: 16, firstHeld: 2009, mostWinsDriver: 'L. Hamilton (5)', mostWinsDriverId: 'ham', overtakingDifficulty: 'Medium',
    description: 'The Yas Marina Circuit closes every Formula 1 season as the final round of the World Championship, a position that has endowed it with enormous dramatic weight — most memorably in 2021 when the title was decided in the final metres of the final lap in one of the most controversial and unforgettable conclusions the sport has ever produced. The circuit transitions from a brightly lit start under the setting desert sun to a fully illuminated night race as the laps progress, threading between the vast Yas Marina hotel structure and the waterfront in a layout that was significantly revised ahead of the 2021 season to improve overtaking and increase average lap speeds. Strategy and tyre management remain critical at Abu Dhabi, as the medium and hard compounds behave very differently on the demanding rear tyres across the long high-speed sectors, and the clean desert air typically provides exceptional mechanical grip that allows cars to run at their absolute aerodynamic limits throughout the race distance.',
  },
]

// ─── CIRCUIT IMAGE MAP ────────────────────────────────────────────────────────
const CIRCUIT_IMAGES: Record<string, string> = {
  australia:   australiaImg,
  bahrain:     bahrainImg,
  jeddah:      jeddahImg,
  japan:       japanImg,
  china:       chinaImg,
  miami:       miamiImg,
  imola:       imolaImg,
  monaco:      monacoImg,
  spain:       spainImg,
  canada:      canadaImg,
  austria:     austriaImg,
  silverstone: silverstoneImg,
  hungary:     hungaryImg,
  spa:         spaImg,
  zandvoort:   zandvoortImg,
  monza:       monzaImg,
  baku:        bakuImg,
  singapore:   singaporeImg,
  austin:      austinImg,
  mexico:      mexicoImg,
  interlagos:  interlagosImg,
  lasvegas:    lasvegasImg,
  qatar:       qatarImg,
  abudhabi:    abudhabiImg,
}

const diffColor: Record<string, string> = {
  High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e',
}

// ─── DRIVER LINK ─────────────────────────────────────────────────────────────
// Shared clickable driver name — navigates to /drivers?open={id}
function DriverLink({ name, driverId }: { name: string; driverId?: string }) {
  const navigate = useNavigate()
  if (!driverId) return <span className="font-['Alumni_Sans'] text-[15px] text-white font-semibold leading-tight">{name}</span>
  return (
    <button
      onClick={() => navigate(`/drivers?open=${driverId}`)}
      className="font-['Alumni_Sans'] text-[15px] font-semibold leading-tight text-left underline underline-offset-2 decoration-[rgba(216,43,13,0.5)] hover:text-[#D82B0D] transition-colors cursor-none"
      style={{ color: '#d1d5dc' }}
    >
      {name}
    </button>
  )
}

// ─── INLINE DRAWER ────────────────────────────────────────────────────────────
function CircuitDrawer({ circuit: c, onClose }: { circuit: Circuit; onClose: () => void }) {
  const STAT_ITEMS: { label: string; value: string | number; driverId?: string }[] = [
    { label: 'Circuit Length',     value: c.length },
    { label: 'Laps',               value: c.laps },
    { label: 'Times Held',         value: c.timesHeld },
    { label: 'First Held',         value: c.firstHeld },
    { label: 'Most Wins (Driver)', value: c.mostWinsDriver, driverId: c.mostWinsDriverId },
    { label: 'Overtaking',         value: c.overtakingDifficulty },
  ]

  return (
    <div
      className="col-span-3 rounded-xl overflow-hidden animate-[fadeIn_0.2s_ease]"
      style={{
        background: '#161a1d',
        border: '1px solid rgba(216,43,13,0.35)',
        boxShadow: '0 8px 32px rgba(216,43,13,0.15)',
      }}
    >
      {/* Red top stripe */}
      <div className="h-[5px] w-full bg-[#D82B0D]" />

      <div className="p-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{c.flag}</span>
            <div>
              <h2 className={H2}>{c.name} Grand Prix</h2>
              <p className={META}>{c.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#748386] hover:text-white transition-colors cursor-none"
            style={{ background: 'rgba(124,152,158,0.12)', border: '1px solid rgba(124,152,158,0.2)' }}
          >
            ✕
          </button>
        </div>

        {/* Description — full paragraph */}
        <div
          className="rounded-lg p-4 mb-5"
          style={{ background: '#1a1e22', border: '1px solid rgba(124,152,158,0.12)' }}
        >
          <p className="font-['Alumni_Sans'] text-[15px] text-[#c8cdd4] leading-relaxed">{c.description}</p>
        </div>

        {/* 6-column stats — above track record */}
        <div className="grid grid-cols-6 gap-4 mb-5">
          {STAT_ITEMS.map(({ label, value, driverId }) => {
            const isOvertaking = label === 'Overtaking'
            const valueStr = String(value)

            return (
              <div key={label} className="border-l-2 border-[rgba(216,43,13,0.4)] pl-[14px]">
                <p className={META}>{label}</p>
                <div className="mt-1">
                  {isOvertaking ? (
                    <span
                      className="inline-block font-['Alumni_Sans'] text-[13px] font-bold rounded px-2 py-0.5"
                      style={{
                        color: diffColor[valueStr],
                        background: `${diffColor[valueStr]}18`,
                        border: `1px solid ${diffColor[valueStr]}40`,
                      }}
                    >
                      {valueStr}
                    </span>
                  ) : (
                    <DriverLink name={valueStr} driverId={driverId} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Track Record */}
        <div
          className="rounded-lg px-5 py-4 flex items-center gap-6"
          style={{ background: 'rgba(216,43,13,0.06)', border: '1px solid rgba(216,43,13,0.25)' }}
        >
          <div>
            <p className="font-['Zen_Dots'] text-[10px] text-[#748386] uppercase tracking-widest mb-1">Track Record</p>
            <p className="font-['Alumni_Sans_Inline_One'] text-[42px] text-white leading-none">{c.lapRecord}</p>
          </div>
          <div className="w-px self-stretch bg-[rgba(216,43,13,0.25)]" />
          <div>
            <DriverLink name={c.lapRecordHolder} driverId={c.lapRecordHolderId} />
            <p className={META}>{c.lapRecordYear}</p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── TRACK CARD ───────────────────────────────────────────────────────────────
function TrackCard({ circuit: c, selected, onClick }: { circuit: Circuit; selected: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const img = CIRCUIT_IMAGES[c.id]

  const words = c.name.split(' ')
  const line1 = words[0]
  const line2 = words.slice(1).join(' ') || 'Grand Prix'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative rounded-xl cursor-none overflow-hidden transition-all duration-200"
      style={{
        background: '#161a1d',
        border: `1px solid ${selected ? '#D82B0D' : hov ? 'rgba(124,152,158,0.35)' : 'rgba(124,152,158,0.12)'}`,
        transform: selected ? 'translateY(-4px)' : hov ? 'translateY(-2px)' : 'none',
        boxShadow: selected
          ? '0 12px 32px rgba(216,43,13,0.35)'
          : hov ? '0 4px 16px rgba(124,152,158,0.10)' : 'none',
      }}
    >
      <div className="h-[5px] w-full" style={{ background: selected ? '#D82B0D' : 'rgba(216,43,13,0.35)' }} />

      {img && (
        <img
          src={img}
          alt={c.name}
          className="w-full object-cover block"
          style={{ aspectRatio: '16/9', background: '#2d2e30' }}
          onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      )}

      <div className="p-3 pb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span
            className="font-['Alumni_Sans'] text-[11px] uppercase tracking-wider"
            style={{ color: selected ? '#D82B0D' : '#748386' }}
          >
            {c.country}
          </span>
          <span className="text-base">{c.flag}</span>
        </div>

        <p className="font-['Alumni_Sans'] font-bold text-white text-[17px] leading-tight">{line1}</p>
        <p
          className="font-['Alumni_Sans'] font-bold text-[17px] leading-tight"
          style={{ color: selected ? '#D82B0D' : 'white' }}
        >
          {line2}
        </p>

        <div
          className="mt-3 flex justify-between items-center rounded-md px-2 py-1.5"
          style={{
            background: selected ? 'rgba(216,43,13,0.10)' : 'rgba(124,152,158,0.06)',
            border: `1px solid ${selected ? 'rgba(216,43,13,0.35)' : 'rgba(124,152,158,0.15)'}`,
          }}
        >
          <span className="font-['Alumni_Sans'] text-[10px] text-[#748386] uppercase tracking-wide">Lap record</span>
          <span className="font-['Zen_Dots'] text-[11px]" style={{ color: selected ? '#D82B0D' : '#9FA0C3' }}>
            {c.lapRecord}
          </span>
        </div>
      </div>

      {selected && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
          style={{ background: '#D82B0D', boxShadow: '0 0 10px #D82B0D' }}
        />
      )}
    </div>
  )
}

export default function Circuits() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelect(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  // ── Row-aware drawer insertion — 3 columns ─────────────────────────────────
  const rows: Circuit[][] = []
  for (let i = 0; i < ALL_CIRCUITS.length; i += 3) {
    rows.push(ALL_CIRCUITS.slice(i, i + 3))
  }

  const selectedCircuit = selectedId ? ALL_CIRCUITS.find(c => c.id === selectedId) ?? null : null

  return (
    <div className={PAGE}>

      {/* ── DRS page-load sweep ──────────────────────────────────────────── */}
      <DRSSweep delay={80} />

      <div className={INNER}>

        {/* Header */}
        <div
          className="relative text-right rounded-xl py-6 px-6 overflow-hidden border border-[rgba(124,152,158,0.1)]"
          style={{ background: 'linear-gradient(105deg,rgba(216,43,13,0.04) 0%,transparent 60%)' }}
        >
          <div className="absolute inset-0 diag-stripes opacity-50 rounded-xl" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D82B0D] rounded-l-xl" />
          <div className="relative">
            <h1 className={H1}>Circuit Analysis</h1>
            <p className="font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]">Track mapping and optimisation — all 24 circuits</p>
          </div>
        </div>

        <SectionDivider variant="sector" label="Circuit Selection" />

        {/* ── 3-column circuit grid with inline row drawer ───────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {rows.map((row, rowIdx) => {
            const rowContainsSelected = row.some(c => c.id === selectedId)

            return (
              <Fragment key={rowIdx}>
                {row.map(c => (
                  <TrackCard
                    key={c.id}
                    circuit={c}
                    selected={selectedId === c.id}
                    onClick={() => handleSelect(c.id)}
                  />
                ))}

                {rowContainsSelected && selectedCircuit && (
                  <CircuitDrawer
                    key={`drawer-${selectedCircuit.id}`}
                    circuit={selectedCircuit}
                    onClose={() => setSelectedId(null)}
                  />
                )}
              </Fragment>
            )
          })}
        </div>

      </div>
    </div>
  )
}
