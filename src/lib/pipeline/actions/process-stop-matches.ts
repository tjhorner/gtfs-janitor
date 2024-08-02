import type { GTFSStop } from "$lib/gtfs/parser"
import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { calculateDistanceMeters } from "$lib/util/geo-math"

function getWheelchairTag(wheelchairBoarding: string) {
  switch (wheelchairBoarding) {
    case "1": // "Some vehicles at this stop can be boarded by a rider in a wheelchair"
      return "yes"
    case "2": // "Wheelchair boarding is not possible at this stop"
      return "no"
    case "0": // "No accessibility information for the stop"
    default:
      return undefined
  }
}

function tagsForOsmBusStop(stop: GTFSStop) {
  const sanitizedName = stop.stop_name.replaceAll(/ +/g, " ").trim()
  const wheelchairTag = getWheelchairTag(stop.wheelchair_boarding)

  return {
    "highway": "bus_stop",
    "bus": "yes",
    // TODO: Conditionally apply `public_transport=platform` based on
    // whether there is a separately mapped platform
    // "public_transport": "platform",
    "name": sanitizedName,
    "ref": stop.stop_code,
    "network": "King County Metro",
    "network:short": "KCM",
    "network:wikidata": "Q6411393",
    "network:wikipedia": "en:King County Metro",
    "operator": "King County Metro",
    "operator:short": "KCM",
    "operator:wikidata": "Q6411393",
    "operator:wikipedia": "en:King County Metro",
    "gtfs:feed": "US-WA-KCM",
    "gtfs:stop_id": stop.stop_id,
    ...(wheelchairTag ? {
      "wheelchair": wheelchairTag
    } : { })
  }
}

export function processStopMatches(stopMatches: MatchedBusStop[], osmChange: OsmChangeFile) {
  for (const stopMatch of stopMatches) {
    if (stopMatch.match?.ambiguous) {
      console.warn(`Ambiguous match for stop ${stopMatch.stop.stop_id}: ${stopMatch.match.matchedBy}`)
      continue
    }

    if (stopMatch.match === null) {
      const newNode: Node = {
        type: "node",
        id: -stopMatch.stop.stop_id,
        lat: stopMatch.stop.stop_lat,
        lon: stopMatch.stop.stop_lon,
        changeset: -1,
        version: 1,
        tags: {
          ...tagsForOsmBusStop(stopMatch.stop),
          "public_transport": "platform"
        }
      }

      osmChange.addElement(newNode)
      continue
    }

    const modifiedNode: Node = structuredClone(stopMatch.match.element)

    const distanceFromExistingNode = calculateDistanceMeters(
      stopMatch.stop.stop_lat,
      stopMatch.stop.stop_lon,
      stopMatch.match.element.lat,
      stopMatch.match.element.lon
    )

    if (distanceFromExistingNode > 30) {
      modifiedNode.lat = stopMatch.stop.stop_lat
      modifiedNode.lon = stopMatch.stop.stop_lon
    }

    modifiedNode.tags = {
      ...modifiedNode.tags,
      ...tagsForOsmBusStop(stopMatch.stop)
    }

    if (modifiedNode.tags["disused:highway"]) {
      console.log(modifiedNode)
    }

    delete modifiedNode.tags["disused:highway"]
    osmChange.modifyElement(modifiedNode)
  }
}