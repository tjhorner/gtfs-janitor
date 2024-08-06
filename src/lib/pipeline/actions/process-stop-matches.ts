import { GTFSRouteType, type GTFSRoute, type GTFSStop } from "$lib/gtfs/types"
import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { calculateDistanceMeters } from "$lib/util/geo-math"
import nunjucks from "nunjucks"
import type { MatchedBusStop } from "../matcher/bus-stops"
import flush from "just-flush"
import { orderBy as naturalSort } from "natural-orderby"
import { crc32 } from "$lib/util/crc32"

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

function preCompileTagTemplates(tags: { [key: string]: string }): [ string, nunjucks.Template | string ][] {
  nunjucks.configure({ autoescape: false })
  return Object.entries(tags).map(([key, value]) => {
    const isTemplate = value.includes("{{") || value.includes("{%")
    return isTemplate ? [ key, nunjucks.compile(value) ] : [ key, value ]
  })
}

function getLocalRef(name: string) {
  const bayRegex = /- bay ([0-9]+)$/i
  const match = name.match(bayRegex)

  if (match) {
    return match[1]
  }
}

function getRouteRef(routes: GTFSRoute[]) {
  if (routes.length === 0) return undefined
  return naturalSort(routes, [ "route_short_name" ])
    .map(route => route.route_short_name.trim())
    .join(";")
}

function tagsForOsmBusStop(stop: GTFSStop) {
  const sanitizedName = stop.stop_name.replaceAll(/ +/g, " ").trim()
  const wheelchairTag = getWheelchairTag(stop.wheelchair_boarding)

  const routeTypesAtStop = new Set(stop.routesServingStop?.map(route => route.route_type))

  const busTags = (
    routeTypesAtStop.has(GTFSRouteType.BUS) ? {
      "bus": "yes",
      "highway": "bus_stop"
    } : { }
  )

  const tramTags = (
    routeTypesAtStop.has(GTFSRouteType.TRAM) ? {
      "tram": "yes",
      "railway": "tram_stop"
    } : { }
  )

  const ferryTags = (
    routeTypesAtStop.has(GTFSRouteType.FERRY) ? {
      "ferry": "yes",
      "amenity": "ferry_terminal"
    } : { }
  )

  return flush({
    "name": sanitizedName,
    "ref": stop.stop_code,
    "local_ref": getLocalRef(sanitizedName),
    "route_ref": getRouteRef(stop.routesServingStop ?? [ ]),
    "gtfs:stop_id": stop.stop_id,
    "wheelchair": wheelchairTag,
    ...busTags,
    ...tramTags,
    ...ferryTags
  })
}

function renderAdditionalTags(stop: GTFSStop, tags: [ string, nunjucks.Template | string ][]) {
  return tags.reduce((acc, [ key, template ]) => {
    return {
      ...acc,
      [key]: typeof template === "string" ? template.trim() : template.render(stop).trim()
    }
  }, { })
}

export interface ProcessStopMatchesOptions {
  createNodes?: boolean
  updateNodes?: boolean,
  additionalTags?: { [key: string]: string }
}

function getNewNodeId(stopId: string) {
  return -Math.abs(crc32(stopId))
}

export function processStopMatches(
  stopMatches: MatchedBusStop[],
  osmChange: OsmChangeFile,
  options: ProcessStopMatchesOptions = { }
) {
  const compiledTags = preCompileTagTemplates(options.additionalTags ?? { })

  for (const stopMatch of stopMatches) {
    if (stopMatch.match?.ambiguous) {
      console.warn(`Ambiguous match for stop ${stopMatch.stop.stop_id}: ${stopMatch.match.matchedBy}`)
      continue
    }

    if (stopMatch.match === null) {
      if (!options.createNodes) continue

      const newNode: Node = {
        type: "node",
        id: getNewNodeId(stopMatch.stop.stop_id),
        lat: stopMatch.stop.stop_lat,
        lon: stopMatch.stop.stop_lon,
        changeset: -1,
        version: 1,
        tags: {
          ...tagsForOsmBusStop(stopMatch.stop),
          "public_transport": "platform",
          ...renderAdditionalTags(stopMatch.stop, compiledTags)
        }
      }

      osmChange.addElement(newNode)
      continue
    }

    if (!options.updateNodes) continue

    const modifiedNode: Node = structuredClone(stopMatch.match.element)

    const distanceFromExistingNode = calculateDistanceMeters(
      stopMatch.stop.stop_lat,
      stopMatch.stop.stop_lon,
      stopMatch.match.element.lat,
      stopMatch.match.element.lon
    )

    if (distanceFromExistingNode > 100) {
      modifiedNode.lat = stopMatch.stop.stop_lat
      modifiedNode.lon = stopMatch.stop.stop_lon
    }

    modifiedNode.tags = {
      ...modifiedNode.tags,
      ...tagsForOsmBusStop(stopMatch.stop),
      ...renderAdditionalTags(stopMatch.stop, compiledTags)
    }

    delete modifiedNode.tags["disused:highway"]
    osmChange.modifyElement(modifiedNode)
  }
}