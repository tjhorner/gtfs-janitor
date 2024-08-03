import type { DisambiguationAction } from "./session"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { averageDistance, calculateDistanceMeters } from "$lib/util/geo-math"
import { matchByIdStrategy } from "../matcher/bus-stops/strategies/by-id"
import { matchByDistanceStrategy } from "../matcher/bus-stops/strategies/by-distance"
import { matchByNameStrategy } from "../matcher/bus-stops/strategies/by-name"

export interface DisambiguationRecommendations {
  summary: string
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
        summary: "Remove duplicate nodes",
        reason: "These nodes have identical stop IDs and are very close together; they are likely duplicates. The newest node should be preserved and the others deleted.",
        actions: candidates.map(node => node.id === newestNode.id ? "match" : "delete")
      }
    }
  }

  if (match.matchedBy === matchByNameStrategy.name) {
    return {
      summary: "Manually review nodes with similar names",
      reason: "These nodes have similar names but none are close enough to the stop location to be a clear match. Use your intuition to match the one that seems the most correct (for example: is it on the same side of the road?).",
      actions: candidates.map(_ => "ignore")
    }
  }

  if (match.matchedBy === matchByDistanceStrategy.name) {
    const closestNodeToStop = candidates.reduce((closest, node) => {
      const distance = calculateDistanceMeters(stop.stop_lat, stop.stop_lon, node.lat, node.lon)
      return distance < closest.distance ? { node, distance } : closest
    }, { node: candidates[0], distance: Infinity }).node

    return {
      summary: "Choose the node closest to the stop",
      reason: "These nodes are close to the stop location but don't match the stop name or ID. The closest node is likely the correct one, but use your intuition to verify this.",
      actions: candidates.map(node => node.id === closestNodeToStop.id ? "match" : "ignore")
    }
  }

  return null
}