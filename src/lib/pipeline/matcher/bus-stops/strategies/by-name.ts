import type { GTFSStop } from "$lib/gtfs/parser"
import type { BusStopMatchingStrategy } from "$lib/pipeline/matcher/bus-stops"
import type { Node } from "$lib/osm/overpass"
import { calculateDistanceMeters } from "$lib/util/geo-math"

export const matchByNameStrategy = {
  name: "name",
  match: (stopNodes: Node[], stopToMatch: GTFSStop): Node[] => {
    const stopsMatchingName = stopNodes.filter(node => (
      node.tags["name"] === stopToMatch.stop_name ||
      node.tags["ref"] === stopToMatch.stop_name
    ))

    if (stopsMatchingName.length === 1) {
      return stopsMatchingName
    }

    if (stopsMatchingName.length === 0) {
      return [ ]
    }

    const { element } = stopsMatchingName.reduce((closest, stop) => {
      const distance = calculateDistanceMeters(
        stop.lat,
        stop.lon,
        stopToMatch.stop_lat,
        stopToMatch.stop_lon
      )

      if (distance < closest.distance) {
        return { element: stop, distance }
      }

      return closest
    }, { element: stopsMatchingName[0], distance: Infinity })

    return [ element ]
  }
} satisfies BusStopMatchingStrategy<"name">
