export type ScenarioId = 'visitors' | 'lastmile'

export const briefingSummary =
  'Private cars still carry most visitor trips onto Saadiyat, with shuttle share spiking only on Louvre–hotel peaks. Beach–NYUAD hops stay short and taxi-shaped; cycling remains a thin slice of island movement.'

export type Scenario = {
  id: ScenarioId
  kicker: string
  title: string
  kpi: [string, string]
  question: string
  reply: string
  analysis: string[]
  mapLayers: string[]
}

export const scenarios: Scenario[] = [
  {
    id: 'visitors',
    kicker: 'Scenario 01',
    title: 'Cultural District, 2024',
    kpi: [
      'Private cars still carry most visitor trips onto Saadiyat.',
      'Shuttle share spikes only on Louvre–hotel peak windows.',
    ],
    question:
      'How do peak visitor flows move between Louvre Abu Dhabi and the beach hotels?',
    reply:
      'Peak visitor movement on Saadiyat in 2024 is a two-pulse corridor. Morning arrivals concentrate at Louvre Abu Dhabi from the mainland bridges, then after midday the same vehicles and taxis reverse toward the beach hotels. Shuttle demand is real but thin except Friday to Sunday, when hotel guests bunch into the 10–13 and 16–19 windows. The map shows that intensity as a heat ribbon pinned to the Cultural District head of the island, with the hotel shore lighting up later in the day.',
    analysis: [
      'Louvre remains the strongest single attractor; hotel dwell is longer but more diffuse along the north shore.',
      'Taxi and private car still absorb the Louvre–beach hop because the shuttle loop is infrequent off-peak.',
      'A timed Cultural District shuttle, stacked on Friday peaks, would cut the hottest heatmap cells without new road capacity.',
    ],
    mapLayers: ['visitors-heat', 'shuttle-corridor', 'pois-culture'],
  },
  {
    id: 'lastmile',
    kicker: 'Scenario 02',
    title: 'NYUAD–beach last-mile, 2024',
    kpi: [
      'Beach–NYUAD trips are short, frequent, and taxi-shaped.',
      'Cycling and micro-mobility remain a thin share of island hops.',
    ],
    question:
      'What does a lower-carbon last-mile network look like on the NYUAD–beach corridor?',
    reply:
      'The NYUAD to beach hop is already last-mile in length — under ten minutes by car — which is why taxis win and why a low-carbon network can win too. In 2024 the corridor is a missing bike spine: campus, coastal promenade, and hotel driveways almost touch, but they do not read as one route. Prioritising a protected cycle and e-shuttle loop on that shore would capture the short trips that never needed a private car, and would bleed pressure off the Cultural District taxi queue at peak.',
    analysis: [
      'Most NYUAD–beach trips are sub-4 km; that is cycling and on-demand shuttle territory, not highway territory.',
      'A continuous coastal spine plus campus gates would let students and hotel staff skip the taxi default.',
      'Pairing the spine with an EV shuttle headway under 8 minutes is the 2024-shaped move: small fleet, high frequency, visible on the island.',
    ],
    mapLayers: ['lastmile-heat', 'cycle-spine', 'shuttle-corridor', 'pois-campus'],
  },
]

export function matchScenario(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (
    t.includes('cycle') ||
    t.includes('last-mile') ||
    t.includes('last mile') ||
    t.includes('nyu') ||
    t.includes('carbon') ||
    t.includes('campus') ||
    t.includes('micro')
  ) {
    return 'lastmile'
  }
  return 'visitors'
}

export function scenarioById(id: ScenarioId): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]
}
