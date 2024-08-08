import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { calculateDistanceMeters } from "$lib/util/geo-math"
import nunjucks from "nunjucks"
import type { MatchedBusStop } from "../matcher/bus-stops"
import flush from "just-flush"
import { orderBy as naturalSort } from "natural-orderby"
import { crc32 } from "$lib/util/crc32"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { GTFSRouteType, type IGTFSRoute } from "$lib/repository/gtfs/route"
import GTFSRepository from "$lib/repository/gtfs"

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

function getRouteRef(routes: IGTFSRoute[]) {
  if (routes.length === 0) return undefined
  return naturalSort(routes, [ "route_short_name" ])
    .map(route => route.shortName.trim())
    .join(";")
}

export function tagsForOsmBusStop(stop: IGTFSStop, routesServingStop: IGTFSRoute[]) {
  const sanitizedName = stop.name.replaceAll(/ +/g, " ").trim()
  const wheelchairTag = getWheelchairTag(stop.wheelchairBoarding)

  const routeTypesAtStop = new Set(routesServingStop.map(route => route.type))

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
    "ref": stop.code,
    "local_ref": getLocalRef(sanitizedName),
    "route_ref": getRouteRef(routesServingStop),
    "gtfs:stop_id": stop.id,
    "wheelchair": wheelchairTag,
    ...busTags,
    ...tramTags,
    ...ferryTags
  })
}

function renderAdditionalTags(stop: IGTFSStop, tags: [ string, nunjucks.Template | string ][]) {
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

export async function processStopMatches(
  stopMatches: MatchedBusStop[],
  osmChange: OsmChangeFile,
  repository: GTFSRepository,
  options: ProcessStopMatchesOptions = { }
) {
  const compiledTags = preCompileTagTemplates(options.additionalTags ?? { })
  const routesServingStops = await repository.getRoutesForAllStopIds()

  for (const stopMatch of stopMatches) {
    const stop = stopMatch.stop
    if (stopMatch.match?.ambiguous) {
      console.warn(`Ambiguous match for stop ${stop.id}: ${stopMatch.match.matchedBy}`)
      continue
    }

    const routesServingStop = Array.from(routesServingStops.get(stop.id) ?? [ ])
    if (stopMatch.match === null) {
      if (!options.createNodes) continue

      const newNode: Node = {
        type: "node",
        id: getNewNodeId(stop.id),
        lat: stop.lat,
        lon: stop.lon,
        changeset: -1,
        version: 1,
        tags: {
          ...tagsForOsmBusStop(stop, routesServingStop),
          "public_transport": "platform",
          ...renderAdditionalTags(stop, compiledTags)
        }
      }

      osmChange.addElement(newNode)
      continue
    }

    if (!options.updateNodes) continue

    const modifiedNode: Node = structuredClone(stopMatch.match.element)

    const distanceFromExistingNode = calculateDistanceMeters(
      stop.lat,
      stop.lon,
      stopMatch.match.element.lat,
      stopMatch.match.element.lon
    )

    if (distanceFromExistingNode > 100) {
      modifiedNode.lat = stop.lat
      modifiedNode.lon = stop.lon
    }

    modifiedNode.tags = {
      ...modifiedNode.tags,
      ...tagsForOsmBusStop(stop, routesServingStop),
      ...renderAdditionalTags(stop, compiledTags)
    }

    delete modifiedNode.tags["disused:highway"]
    delete modifiedNode.tags["disused:public_transport"]

    osmChange.modifyElement(modifiedNode)
  }
}