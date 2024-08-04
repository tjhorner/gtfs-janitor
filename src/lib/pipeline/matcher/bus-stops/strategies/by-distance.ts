import type { GTFSStop } from "$lib/gtfs/types"
import type { Node } from "$lib/osm/overpass"
import type { BusStopMatchingStrategy, MatchingStrategyResult } from "$lib/pipeline/matcher/bus-stops"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByDistanceStrategy = {
  name: "distance",
  match: (candidates: readonly Node[], stopToMatch: Readonly<GTFSStop>): MatchingStrategyResult => {
    const stopsCloseToTarget = candidates
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.stop_lat, stopToMatch.stop_lon)
      }))
      .filter(stop => stop.distance <= 100)
      .sort((a, b) => a.distance - b.distance)

    if (stopsCloseToTarget.length > 0 && stopsCloseToTarget[0].distance <= 10) {
      // Auto-match if the closest node is incredibly close
      return { elements: [ stopsCloseToTarget[0].stop ] }
    }
    
    if (stopsCloseToTarget.length === 1 && stopsCloseToTarget[0].distance <= 30) {
      // Auto-match if the closest node is reasonably close and there's only one
      return { elements: [ stopsCloseToTarget[0].stop ] }
    }

    // Otherwise submit for human review
    return {
      alwaysAmbiguous: true,
      elements: stopsCloseToTarget.map(stop => stop.stop)
    }
  }
} satisfies BusStopMatchingStrategy<"distance">
