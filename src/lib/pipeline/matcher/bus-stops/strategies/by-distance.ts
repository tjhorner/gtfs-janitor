import type { GTFSStop } from "$lib/gtfs/parser"
import type { Node } from "$lib/osm/overpass"
import type { BusStopMatchingStrategy } from "$lib/pipeline/matcher/bus-stops"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByDistanceStrategy = {
  name: "distance",
  match: (candidates: readonly Node[], stopToMatch: Readonly<GTFSStop>): Node[] => {
    const stopsCloseToTarget = candidates
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.stop_lat, stopToMatch.stop_lon)
      }))
      .filter(stop => stop.distance < 20)
      .sort((a, b) => a.distance - b.distance)

    return stopsCloseToTarget.map(stop => stop.stop)
  }
} satisfies BusStopMatchingStrategy<"distance">
