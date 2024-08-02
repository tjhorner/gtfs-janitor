import type { GTFSStop } from "$lib/gtfs/parser"
import type { BusStopMatchingStrategy } from "$lib/pipeline/matcher/bus-stops"
import type { Node } from "$lib/osm/overpass"
import { calculateDistanceMeters } from "$lib/util/geo-math"
import memoize from "memoize"

const normalizeStopName = memoize((name?: string) => {
  if (!name) {
    return ""
  }

  return name
    .toLowerCase()
    .replaceAll(/\bstreet\b/g, "st")
    .replaceAll(/\bavenue\b/g, "ave")
    .replaceAll(/\bboulevard\b/g, "blvd")
    .replaceAll(/\broad\b/g, "rd")
    .replaceAll(/\bdrive\b/g, "dr")
    .replaceAll(/\blane\b/g, "ln")
    .replaceAll(/\bcourt\b/g, "ct")
    .replaceAll(/\bplace\b/g, "pl")
    .replaceAll(/\bcircle\b/g, "cir")
    .replaceAll(/\b(and|\/)\b/g, "&")
    .replaceAll(/ +/g, " ")
    .trim()
})

export const matchByNameStrategy = {
  name: "name",
  match: (candidates: readonly Node[], stopToMatch: Readonly<GTFSStop>): Node[] => {
    const normalizedName = normalizeStopName(stopToMatch.stop_name)

    const stopsMatchingName = candidates.filter(node => (
      normalizeStopName(node.tags["name"]) === normalizedName ||
      normalizeStopName(node.tags["ref"]) === normalizedName
    ))

    if (stopsMatchingName.length <= 1) {
      return stopsMatchingName
    }

    const closeStopsMatchingName = stopsMatchingName
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.stop_lat, stopToMatch.stop_lon)
      }))
      .filter(stop => stop.distance < 100)
      .sort((a, b) => a.distance - b.distance)

    // If there's a node that's very clearly the same stop, return just that one
    const incrediblyCloseStops = closeStopsMatchingName.filter(stop => stop.distance < 10)
    if (incrediblyCloseStops.length === 1) {
      return [ incrediblyCloseStops[0].stop ]
    }

    // ...otherwise, return all the somewhat-close stops for human review
    return closeStopsMatchingName.map(stop => stop.stop)
  }
} satisfies BusStopMatchingStrategy<"name">
