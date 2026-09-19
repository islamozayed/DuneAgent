export type ScenarioId = 'transit' | 'roads' | 'tolls' | 'landuse'
export type MapFocus = 'saadiyat' | 'yas'

export const briefingSummary =
  'Abu Dhabi is becoming a stacked network of rail, water, and shared fleets. Demand is absorbed on those layers — not new lanes on the highway.'

export type Scenario = {
  id: ScenarioId
  number: string
  title: string
  blurb: string
  image: string
  questions: string[]
  reply: string
  analysis: string[]
  mapLayers: string[]
  mapFocus: MapFocus
  mapTitle: string
}

export const scenarios: Scenario[] = [
  {
    id: 'transit',
    number: '01',
    title: 'Mass Transit',
    blurb: 'Explore metro, BRT, shuttles and multi-modal connectivity.',
    image: 'images/mass-transit.jpg',
    questions: [
      'What will public transport ridership look like in 2040?',
      'Where should new metro stations be prioritized?',
      'How does the cultural shuttle reduce private car trips?',
    ],
    reply:
      'By 2040 Saadiyat is a completed cultural island, not a Louvre-and-hotel hop. Guggenheim Abu Dhabi (from December 2026), Zayed National Museum, the Natural History Museum, teamLab Phenomena, and Dar al Funoon sit with Louvre on one walkable spine. The 2024 pattern — private cars onto the island, taxis for the last kilometre — does not survive that density. A timed Cultural District shuttle, a coastal cycle and e-mobility spine, and a water taxi to downtown absorb the peak, while the map’s heat settles along the museum head of the island instead of the hotel driveway.',
    analysis: [
      'Five anchors on one shore means a high-frequency shuttle loop, not more parking at each gate.',
      'Most on-island hops stay under 4 km — cycling, e-shuttle, and ferry territory once the coastal spine is continuous.',
      'Tie the loop to downtown and Zayed International so visitors never need a private car the moment they leave the museum steps.',
    ],
    mapLayers: ['visitors-heat', 'shuttle-corridor', 'cycle-spine', 'pois-culture'],
    mapFocus: 'saadiyat',
    mapTitle: 'Saadiyat Island, 2040 — Cultural District heat, shuttle loop, and coastal spine',
  },
  {
    id: 'roads',
    number: '02',
    title: 'Roads',
    blurb: 'Understand road capacity, traffic flow and bottlenecks.',
    image: 'images/roads.jpg',
    questions: [
      'Which roads will be most congested in 2030?',
      'How will new developments impact travel times?',
      'Where are the key network gaps?',
    ],
    reply:
      'Disneyland Abu Dhabi lands on Yas’s waterfront in the early 2030s, on an island that already saw 38 million visits in 2024. Construction — typically four to six years after design — will overlap the build of Tram Line 4, the 100 km/h light rail from Zayed International through Yas, Al Raha, and the airport corridor, rated at about 6,630 passengers an hour. The risk is a double peak: haulage and workforce on the same E10/airport roads that already feed Ferrari World, Warner Bros., SeaWorld, and F1. The map shows that pressure as a heat band on Yas North and the airport approach. The move is to open the tram before the park, keep construction freight on a night haul route, and hold guest traffic on rail rather than on Sheikh Zayed Road.',
    analysis: [
      'Yas North construction and today’s parks cannot share one unseparated highway peak — dedicated haul gates and night freight are the construction-phase rule.',
      'Tram Line 4 (works from 2026, service targeted 2030) has to be live before Disney gates, or opening-year demand lands on cars.',
      'Park-and-ride at Al Raha and the airport, plus a 20-minute air-rail hop from Terminal A, keep the island’s existing 38 million visits from colliding with a seventh global Disney resort.',
    ],
    mapLayers: ['disney-heat', 'tram-line', 'highway-pressure', 'pois-disney'],
    mapFocus: 'yas',
    mapTitle: 'Yas Island — Disneyland construction pressure and Tram Line 4',
  },
  {
    id: 'tolls',
    number: '03',
    title: 'Toll Road & Pricing',
    blurb: 'Explore metro, BRT, shuttles and multi-modal connectivity.',
    image: 'images/road-tolls.png',
    questions: [
      'What will public transport ridership look like in 2040?',
      'Where should new metro stations be prioritized?',
      'How does the cultural shuttle reduce private car trips?',
    ],
    reply:
      'Corridor pricing is how Abu Dhabi keeps the 2030 visitor surge off a wider Sheikh Zayed Road. A gantry network on the E10, airport approach, and island bridges can peak-price the car while the tram and cultural shuttle stay free at the same hour. Construction freight for Yas North pays a night rate; daytime guest traffic is steered onto rail. The map’s heat band is the price signal — where delay concentrates, the toll should rise, and where a station or shuttle already exists, the toll should make that the cheaper door-to-door choice.',
    analysis: [
      'Price the bottleneck, not the whole emirate — E10, island bridges, and the airport approach are the three gates that set delay.',
      'Align peak tolls with tram and shuttle headways so the cheaper path is always the public one.',
      'Night freight discounts keep Disney-era haulage off the visitor peak without adding lanes.',
    ],
    mapLayers: ['disney-heat', 'tram-line', 'highway-pressure', 'pois-disney'],
    mapFocus: 'yas',
    mapTitle: 'Abu Dhabi corridors — peak pricing, haul routes, and rail alternatives',
  },
  {
    id: 'landuse',
    number: '04',
    title: 'Land Use',
    blurb: 'Explore density, mixed-use plots and waterfront last-mile.',
    image: 'images/land-use.jpg',
    questions: [
      'Where should mixed-use density sit on Saadiyat?',
      'How does waterfront zoning change last-mile demand?',
      'Which plots stay cultural versus residential?',
    ],
    reply:
      'By 2040 the Saadiyat cultural shore is a completed mixed-use district, not a museum campus with empty plots between gates. Guggenheim Abu Dhabi, Zayed National Museum, the Natural History Museum, and Louvre sit on one walkable waterfront, but the decade’s question is what fills the plots between them — hotel, residential, or cultural buffer. Put housing and ground-floor retail on the inland side of the spine, keep the waterfront civic, and last-mile hops stay under a kilometre. Scatter density across the island and every visitor trip becomes a car trip back to the hotel driveway.',
    analysis: [
      'Concentrate mixed-use on the inland plots so the museum shore stays civic and walkable.',
      'Waterfront zoning that forbids driveway hotels keeps last-mile demand on the shuttle and cycle spine.',
      'A cultural-first plot map — Louvre to Guggenheim — is the 2040 land-use rule; residential fills the gaps, not the gates.',
    ],
    mapLayers: ['visitors-heat', 'shuttle-corridor', 'cycle-spine', 'pois-culture'],
    mapFocus: 'saadiyat',
    mapTitle: 'Saadiyat Island, 2040 — cultural plots, mixed-use density, and waterfront last-mile',
  },
]

export function matchScenario(text: string): ScenarioId {
  const t = text.toLowerCase().trim()
  const exact = scenarios.find((s) => s.questions.some((q) => q.toLowerCase() === t))
  if (exact) return exact.id
  if (
    t.includes('land use') ||
    t.includes('land-use') ||
    t.includes('landuse') ||
    t.includes('zoning') ||
    t.includes('density') ||
    t.includes('mixed-use') ||
    t.includes('mixed use') ||
    t.includes('waterfront') ||
    t.includes('plot')
  ) {
    return 'landuse'
  }
  if (t.includes('toll') || t.includes('pricing') || t.includes('salik') || t.includes('charge')) {
    return 'tolls'
  }
  if (
    t.includes('disney') ||
    t.includes('disneyland') ||
    t.includes('yas') ||
    t.includes('construction') ||
    t.includes('congest') ||
    t.includes('traffic') ||
    t.includes('travel time') ||
    t.includes('bottleneck') ||
    t.includes('highway') ||
    t.includes('road')
  ) {
    return 'roads'
  }
  return 'transit'
}

export function scenarioById(id: ScenarioId): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]
}

/** Scenario title, or a short line derived from a freeform question. */
export function titleForPrompt(id: ScenarioId, text?: string): string {
  const scenario = scenarioById(id)
  if (!text) return scenario.title
  const trimmed = text.trim()
  if (scenario.questions.some((q) => q.toLowerCase() === trimmed.toLowerCase())) return scenario.title
  const known = scenarios.find((s) => s.questions.some((q) => q.toLowerCase() === trimmed.toLowerCase()))
  if (known) return known.title
  const cleaned = trimmed.replace(/[?!.,]+$/g, '').trim()
  if (!cleaned) return scenario.title
  if (cleaned.length <= 42) return cleaned
  const cut = cleaned.slice(0, 42)
  const at = cut.lastIndexOf(' ')
  return `${at > 18 ? cut.slice(0, at) : cut}…`
}
