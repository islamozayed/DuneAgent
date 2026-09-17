export type ScenarioId = 'saadiyat' | 'disney'
export type MapFocus = 'saadiyat' | 'yas'

export const briefingSummary =
  'By 2040, Abu Dhabi moves as a stacked network: Etihad Rail to the federation, a 100 km/h tram from Zayed International into Yas, and last-mile loops across Saadiyat’s cultural district. Tourism Strategy 2030 already points to 39 million visitors; the decade after absorbs that demand on rails, water, and shared fleets — not new lanes on Sheikh Zayed Road.'

export type Scenario = {
  id: ScenarioId
  kicker: string
  title: string
  kpi: [string, string]
  question: string
  reply: string
  analysis: string[]
  mapLayers: string[]
  mapFocus: MapFocus
  mapTitle: string
}

export const scenarios: Scenario[] = [
  {
    id: 'saadiyat',
    kicker: 'Scenario 01',
    title: 'Saadiyat Island future outlook',
    kpi: [
      'Saadiyat’s cultural district is a complete museum spine, not a single-attractor hop.',
      'Last-mile shuttles, water, and a coastal cycle spine carry the island — private cars no longer default.',
    ],
    question: 'What does mobility on Saadiyat Island look like in 2040?',
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
    id: 'disney',
    kicker: 'Scenario 02',
    title: 'Disneyland construction mobility outlook',
    kpi: [
      'Yas already drew 38 million visits in 2024 before a Disney-scale gate opens.',
      'Tram Line 4 must open ahead of the park, or construction and guests will share one highway.',
    ],
    question: 'How will the construction of Disneyland Abu Dhabi affect mobility and transportation?',
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
]

export function matchScenario(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (
    t.includes('disney') ||
    t.includes('disneyland') ||
    t.includes('yas') ||
    t.includes('construction') ||
    t.includes('theme park') ||
    t.includes('tram') ||
    t.includes('airport')
  ) {
    return 'disney'
  }
  return 'saadiyat'
}

export function scenarioById(id: ScenarioId): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]
}

/** Scenario title, or a short line derived from a freeform question. */
export function titleForPrompt(id: ScenarioId, text?: string): string {
  const scenario = scenarioById(id)
  if (!text) return scenario.title
  const trimmed = text.trim()
  const known = scenarios.find((s) => s.question.toLowerCase() === trimmed.toLowerCase())
  if (known) return known.title
  const cleaned = trimmed.replace(/[?!.,]+$/g, '').trim()
  if (!cleaned) return scenario.title
  if (cleaned.length <= 42) return cleaned
  const cut = cleaned.slice(0, 42)
  const at = cut.lastIndexOf(' ')
  return `${at > 18 ? cut.slice(0, at) : cut}…`
}
