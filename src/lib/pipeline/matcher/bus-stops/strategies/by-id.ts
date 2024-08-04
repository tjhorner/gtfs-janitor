import type { GTFSStop } from "$lib/gtfs/parser"
import type { Node } from "$lib/osm/overpass"
import type { BusStopMatchingStrategy, MatchingStrategyResult } from "$lib/pipeline/matcher/bus-stops"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByIdStrategy = {
  name: "id",
  match: (candidates: readonly Node[], stopToMatch: Readonly<GTFSStop>): MatchingStrategyResult => {
    const stopsMatchingId = candidates.filter(node => (
      node.tags["gtfs:stop_id"] === stopToMatch.stop_id ||
      node.tags["ref"] === stopToMatch.stop_id ||
      node.tags["gtfs:stop_id"] === stopToMatch.stop_code ||
      node.tags["ref"] === stopToMatch.stop_code
    ))
  
    if (stopsMatchingId.length <= 1) {
      return { elements: stopsMatchingId }
    }

    // `ref` is typically more up-to-date than `gtfs:stop_id` because
    // humans are more likely to edit it
    const stopsWithRef = stopsMatchingId.filter(stop => (
      stop.tags["ref"] === stopToMatch.stop_id ||
      stop.tags["ref"] === stopToMatch.stop_code
    ))
    if (stopsWithRef.length === 1) {
      return { elements: stopsWithRef }
    }
  
    const closeStopsMatchingId = stopsMatchingId
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.stop_lat, stopToMatch.stop_lon)
      }))
      .filter(stop => stop.distance < 100)
      .sort((a, b) => a.distance - b.distance)

    return { elements: closeStopsMatchingId.map(stop => stop.stop) }
  }
} satisfies BusStopMatchingStrategy<"id">
