import type { GTFSStop } from "$lib/gtfs/parser"
import type { BusStopMatchingStrategy } from "$lib/pipeline/matcher/bus-stops"
import type { Node } from "$lib/osm/overpass"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByDistanceStrategy = {
  name: "distance",
  match: (stopNodes: Node[], stopToMatch: GTFSStop): Node[] => {
    const stopsCloseToTarget = stopNodes
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.stop_lat, stopToMatch.stop_lon)
      }))
      .filter(stop => stop.distance < 15)
      .sort((a, b) => a.distance - b.distance)

    if (stopsCloseToTarget.length === 1) {
      return [ stopsCloseToTarget[0].stop ]
    }

    return stopsCloseToTarget.map(stop => stop.stop)
  }
} satisfies BusStopMatchingStrategy<"distance">
