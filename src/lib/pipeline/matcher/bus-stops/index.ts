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
  elements: readonly Readonly<Node>[]
}

export type BusStopMatch<T extends string = string> = DefiniteBusStopMatch<T> | AmbiguousBusStopMatch<T>

export type BusStopMatchingStrategy<T> = {
  name: T
  match: (stopNodes: Node[], stopToMatch: GTFSStop) => Node[]
}

export const defaultStrategies = [
  matchByIdStrategy,
  matchByNameStrategy,
  matchByDistanceStrategy
]

export function matchBusStop(stopNodes: Node[], stopToMatch: GTFSStop) {
  return matchBusStopWithStrategies(stopNodes, stopToMatch, defaultStrategies)
}

export interface MatchedBusStop<T = BusStopMatch | null> {
  stop: GTFSStop
  match: T
}

export async function* matchBusStopBatch(
  stopNodes: Node[],
  stopsToMatch: GTFSStop[]
): AsyncIterable<MatchedBusStop> {
  for (const stop of stopsToMatch) {
    yield {
      stop,
      match: matchBusStop(stopNodes, stop)
    }

    // awful hack to allow the event loop to run
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

export function matchBusStopWithStrategies<T extends string>(
  stopNodes: Node[],
  stopToMatch: GTFSStop,
  strategies: readonly BusStopMatchingStrategy<T>[]
): BusStopMatch<T> | null {
  for (const { name, match } of strategies) {
    const matchedNodes = match(stopNodes, stopToMatch)

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
