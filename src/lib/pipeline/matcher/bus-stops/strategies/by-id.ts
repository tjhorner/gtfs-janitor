import type { Node } from "$lib/osm/overpass"
import type { BusStopMatchingStrategy, MatchingStrategyResult } from "$lib/pipeline/matcher/bus-stops"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByIdStrategy = {
  name: "id",
  match: (candidates: readonly Node[], stopToMatch: Readonly<IGTFSStop>): MatchingStrategyResult => {
    const stopsMatchingId = candidates.filter(node => (
      node.tags["gtfs:stop_id"] === stopToMatch.id ||
      node.tags["ref"] === stopToMatch.id ||
      node.tags["gtfs:stop_id"] === stopToMatch.code ||
      node.tags["ref"] === stopToMatch.code
    ))
  
    if (stopsMatchingId.length <= 1) {
      return { elements: stopsMatchingId }
    }
  
    const closeStopsMatchingId = stopsMatchingId
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.lat, stopToMatch.lon)
      }))
      .filter(stop => stop.distance < 100)
      .sort((a, b) => a.distance - b.distance)

    return { elements: closeStopsMatchingId.map(stop => stop.stop) }
  }
} satisfies BusStopMatchingStrategy<"id">
