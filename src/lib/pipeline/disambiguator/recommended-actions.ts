import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { averageDistance, calculateDistanceMeters } from "$lib/util/geo-math"
import type { BusStopMatch, MatchedBusStop } from "../matcher/bus-stops"
import { matchByDistanceStrategy } from "../matcher/bus-stops/strategies/by-distance"
import { matchByIdStrategy } from "../matcher/bus-stops/strategies/by-id"
import { matchByNameStrategy } from "../matcher/bus-stops/strategies/by-name"
import type { DisambiguationAction } from "./session"

export interface DisambiguationRecommendations {
  summary: string
  reason: string
  actions: DisambiguationAction[]
}

export function recommendDisambiguationActions(match: BusStopMatch, stop: IGTFSStop): DisambiguationRecommendations | null {
  if (!match?.ambiguous) {
    return null
  }

  const candidates = match.elements

  if (match.matchedBy === matchByIdStrategy.name) {
    if (candidates.length === 1) {
      return {
        summary: "Manually verify node with matching stop ID",
        reason: "This node has a matching stop ID but is very far away. This may be a different agency's stop that shares the same ID. Manually verify that it's correct.",
        actions: ["ignore"]
      }
    }

    const avgDistance = averageDistance(candidates)
    if (avgDistance < 40) {
      const mostRecentNodes = [...candidates].sort((a, b) => b.changeset - a.changeset)
      const newestNode = mostRecentNodes[0]

      return {
        summary: "Remove duplicate nodes",
        reason: "These nodes have identical stop IDs and are very close together; they are likely duplicates. Match the node that appears the most up-to-date and delete the others.",
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
      const distance = calculateDistanceMeters(stop.lat, stop.lon, node.lat, node.lon)
      return distance < closest.distance ? { node, distance } : closest
    }, { node: candidates[0], distance: Infinity })

    if (closestNodeToStop.distance <= 30) {
      return {
        summary: "Choose the closest node",
        reason: "These nodes are close to the stop location but don't match the stop name or ID. The closest node is likely the correct one, but use your intuition to verify this.",
        actions: candidates.map(node => node.id === closestNodeToStop.node.id ? "match" : "ignore")
      }
    }

    return {
      summary: "Manually review closest nodes",
      reason: "These nodes are the closest to, but somewhat far away from, the stop location and don't match the stop name or ID. Use your intiution to verify if any of them match.",
      actions: candidates.map(() => "ignore")
    }
  }

  return null
}