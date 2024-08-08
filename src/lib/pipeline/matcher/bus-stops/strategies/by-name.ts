import type { Node } from "$lib/osm/overpass"
import type { BusStopMatchingStrategy, MatchingStrategyResult } from "$lib/pipeline/matcher/bus-stops"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
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
  match: (candidates: readonly Node[], stopToMatch: Readonly<IGTFSStop>): MatchingStrategyResult => {
    const normalizedName = normalizeStopName(stopToMatch.name)

    const stopsMatchingName = candidates.filter(node => (
      normalizeStopName(node.tags["name"]) === normalizedName ||
      normalizeStopName(node.tags["ref"]) === normalizedName
    ))

    if (stopsMatchingName.length === 0) {
      return { elements: [ ] }
    }

    if (stopsMatchingName.length === 1) {
      const node = stopsMatchingName[0]
      const distance = calculateDistanceMeters(node.lat, node.lon, stopToMatch.lat, stopToMatch.lon)

      return {
        elements: stopsMatchingName,
        alwaysAmbiguous: distance > 30
      }
    }

    const closeStopsMatchingName = stopsMatchingName
      .map(stop => ({
        stop,
        distance: calculateDistanceMeters(stop.lat, stop.lon, stopToMatch.lat, stopToMatch.lon)
      }))
      .filter(stop => stop.distance < 100)
      .sort((a, b) => a.distance - b.distance)

    // If there's a node that's very clearly the same stop, return just that one
    const incrediblyCloseStops = closeStopsMatchingName.filter(stop => stop.distance <= 10)
    if (incrediblyCloseStops.length === 1) {
      return { elements: [ incrediblyCloseStops[0].stop ] }
    }

    // ...otherwise, return all the somewhat-close stops for human review
    return { elements: closeStopsMatchingName.map(stop => stop.stop) }
  }
} satisfies BusStopMatchingStrategy<"name">
