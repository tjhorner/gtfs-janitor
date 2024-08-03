import type { GTFSStop } from "$lib/gtfs/parser"
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

export type BusStopMatchingStrategy<T> = {
  name: T
  match: (candidates: readonly Node[], stopToMatch: Readonly<GTFSStop>) => Node[]
}

export const defaultStrategies = [
  matchByIdStrategy,
  matchByNameStrategy,
  matchByDistanceStrategy
]

export function matchBusStop(stopNodes: readonly Node[], stopToMatch: Readonly<GTFSStop>) {
  return matchBusStopWithStrategies(stopNodes, stopToMatch, defaultStrategies)
}

export interface MatchedBusStop<T = BusStopMatch | null> {
  stop: GTFSStop
  match: T
}

export function matchBusStopWithStrategies<T extends string>(
  candidates: readonly Node[],
  stopToMatch: Readonly<GTFSStop>,
  strategies: readonly BusStopMatchingStrategy<T>[]
): BusStopMatch<T> | null {
  for (const { name, match } of strategies) {
    const matchedNodes = match(candidates, stopToMatch)

    if (matchedNodes.length === 1) {
      return {
        ambiguous: false,
        matchedBy: name,
        element: matchedNodes[0]
      }
    }

    if (matchedNodes.length > 1) {
      return {
        ambiguous: true,
        matchedBy: name,
        elements: matchedNodes
      }
    }
  }

  return null
}
