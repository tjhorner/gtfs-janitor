import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import type { Node } from "../../../osm/overpass"
import { matchByDistanceStrategy } from "./strategies/by-distance"
import { matchByIdStrategy } from "./strategies/by-id"
import { matchByNameStrategy } from "./strategies/by-name"

export interface DefiniteBusStopMatch<T> {
  ambiguous: false
  matchedBy: T
  element: Readonly<Node>
}

export interface AmbiguousBusStopMatch<T extends string = string> {
  ambiguous: true
  alwaysAmbiguous: boolean
  matchedBy: T
  elements: Readonly<Node>[]
}

export function isAmbiguousMatch<T extends string>(match: BusStopMatch<T> | null): match is AmbiguousBusStopMatch<T> {
  return !!match && match.ambiguous
}

export function isDefiniteMatch<T extends string>(match: BusStopMatch<T> | null): match is DefiniteBusStopMatch<T> {
  return !!match && !match.ambiguous
}

export type BusStopMatch<T extends string = string> = DefiniteBusStopMatch<T> | AmbiguousBusStopMatch<T>

export interface MatchingStrategyResult {
  alwaysAmbiguous?: boolean
  elements: Node[]
}

export type BusStopMatchingStrategy<T> = {
  name: T
  match: (candidates: readonly Node[], stopToMatch: Readonly<IGTFSStop>) => MatchingStrategyResult
}

export const defaultStrategies = [
  matchByIdStrategy,
  matchByNameStrategy,
  matchByDistanceStrategy
]

export function matchBusStop(stopNodes: readonly Node[], stopToMatch: Readonly<IGTFSStop>) {
  return matchBusStopWithStrategies(stopNodes, stopToMatch, defaultStrategies)
}

export function matchManyBusStops(stopNodes: readonly Node[], stopsToMatch: readonly Readonly<IGTFSStop>[]) {
  return matchManyBusStopsWithStrategies(stopNodes, stopsToMatch, defaultStrategies)
}

export interface MatchedBusStop<T = BusStopMatch | null> {
  stop: IGTFSStop
  match: T
}

export function matchBusStopWithStrategy<T extends string>(
  candidates: readonly Node[],
  stopToMatch: Readonly<IGTFSStop>,
  strategy: BusStopMatchingStrategy<T>
): BusStopMatch<T> | null {
  const { name, match } = strategy
  const { elements, alwaysAmbiguous } = match(candidates, stopToMatch)

  if (elements.length === 0) {
    return null
  }

  if (alwaysAmbiguous || elements.length > 1) {
    return {
      ambiguous: true,
      alwaysAmbiguous: !!alwaysAmbiguous,
      matchedBy: name,
      elements
    }
  }

  if (elements.length === 1) {
    return {
      ambiguous: false,
      matchedBy: name,
      element: elements[0]
    }
  }

  return null
}

export function matchBusStopWithStrategies<T extends string>(
  candidates: readonly Node[],
  stopToMatch: Readonly<IGTFSStop>,
  strategies: readonly BusStopMatchingStrategy<T>[]
): BusStopMatch<T> | null {
  for (const strategy of strategies) {
    const match = matchBusStopWithStrategy(candidates, stopToMatch, strategy)
    if (!match) continue
    return match
  }

  return null
}

export function* matchManyBusStopsWithStrategies<T extends string>(
  candidates: readonly Node[],
  stopsToMatch: readonly Readonly<IGTFSStop>[],
  strategies: readonly BusStopMatchingStrategy<T>[]
): Generator<MatchedBusStop> {
  const unmatchedStops = new Set(stopsToMatch)
  for (const strategy of strategies) {
    for (const stopToMatch of unmatchedStops) {
      const match = matchBusStopWithStrategy(candidates, stopToMatch, strategy)
      if (!match) continue

      unmatchedStops.delete(stopToMatch)
      yield { stop: stopToMatch, match }
    }
  }

  for (const stop of unmatchedStops) {
    yield { stop, match: null }
  }
}
