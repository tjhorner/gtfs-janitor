import type { DisambiguationAction } from "./actions"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { averageDistance, calculateDistanceMeters } from "$lib/util/geo-math"
import { matchByIdStrategy } from "../matcher/bus-stops/strategies/by-id"
import { matchByDistanceStrategy } from "../matcher/bus-stops/strategies/by-distance"

export interface DisambiguationRecommendations {
  reason: string
  actions: DisambiguationAction[]
}

export function recommendDisambiguationActions({ match, stop }: MatchedBusStop): DisambiguationRecommendations | null {
  if (!match?.ambiguous) {
    return null
  }

  const candidates = Object.freeze(match.elements)

  if (match.matchedBy === matchByIdStrategy.name) {
    const avgDistance = averageDistance(candidates)
    if (avgDistance < 40) {
      const mostRecentNodes = [...candidates].sort((a, b) => b.changeset - a.changeset)
      const newestNode = mostRecentNodes[0]

      return {
        reason: "These nodes have identical stop IDs and are very close together; they are likely duplicates. The newest node should be preserved and the others deleted.",
        actions: candidates.map(node => node.id === newestNode.id ? "match" : "delete")
      }
    }
  }

  if (match.matchedBy === matchByDistanceStrategy.name) {
    const closestNodeToStop = candidates.reduce((closest, node) => {
      const distance = calculateDistanceMeters(stop.stop_lat, stop.stop_lon, node.lat, node.lon)
      return distance < closest.distance ? { node, distance } : closest
    }, { node: candidates[0], distance: Infinity }).node

    return {
      reason: "These nodes are close to the stop location but don't match the stop name or ID. One of them is probably the other stop going the opposite direction, so you will probably want to choose the closest one and ignore the others.",
      actions: candidates.map(node => node.id === closestNodeToStop.id ? "match" : "ignore")
    }
  }

  return null
}