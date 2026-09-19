import type { Icon } from '@phosphor-icons/react'
import { Bicycle } from '@phosphor-icons/react/Bicycle'
import { Boat } from '@phosphor-icons/react/Boat'
import { Bus } from '@phosphor-icons/react/Bus'
import { Car } from '@phosphor-icons/react/Car'
import { CurrencyCircleDollar } from '@phosphor-icons/react/CurrencyCircleDollar'
import { Lightbulb } from '@phosphor-icons/react/Lightbulb'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { RoadHorizon } from '@phosphor-icons/react/RoadHorizon'
import { TrafficSign } from '@phosphor-icons/react/TrafficSign'
import { Train } from '@phosphor-icons/react/Train'
import { Truck } from '@phosphor-icons/react/Truck'

/** First matching keyword wins — more specific cues before broad ones. */
const RULES: { pattern: RegExp; icon: Icon }[] = [
  { pattern: /\b(cycl(?:e|ing)|bicycle|e-?mobility|bike)\b/i, icon: Bicycle },
  { pattern: /\b(night|freight|haul(?:age|s|ing)?)\b/i, icon: Truck },
  { pattern: /\b(shuttle|bus|brt)\b/i, icon: Bus },
  { pattern: /\b(metro|tram|light\s*rail|train)\b/i, icon: Train },
  { pattern: /\b(ferry|water\s*taxi|boat)\b/i, icon: Boat },
  { pattern: /\b(pric(?:e|ing)|tolls?|cheaper|gantry)\b/i, icon: CurrencyCircleDollar },
  { pattern: /\b(park(?:ing|-and-ride)|private\s+cars?|\bcars?\b)\b/i, icon: Car },
  { pattern: /\b(congest(?:ion|ed)?|traffic)\b/i, icon: TrafficSign },
  { pattern: /\b(highway|roads?|bottleneck|lanes?)\b/i, icon: RoadHorizon },
  { pattern: /\b(rails?)\b/i, icon: Train },
  { pattern: /\b(station|airport|terminal|downtown)\b/i, icon: MapPin },
]

export function iconForTakeaway(line: string): Icon {
  for (const rule of RULES) {
    if (rule.pattern.test(line)) return rule.icon
  }
  return Lightbulb
}
