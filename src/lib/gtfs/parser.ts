import { BlobReader, ZipReader, type Entry } from "@zip.js/zip.js"
import { ReadableWebToNodeStream } from "readable-web-to-node-stream"
import csv from "csvtojson/v2"
import type GTFSRepository from "$lib/repository/gtfs"
import type { CSVParseParam } from "csvtojson/v2/Parameters"
import type { ImportProfile } from "$lib/pipeline/profile"

function getStreamForEntry(
  entries: Entry[],
  name: string,
  params: Partial<CSVParseParam> = { }
) {
  const entry = entries.find(entry => entry.filename === name)
  if (!entry) {
    throw new Error(`No file named ${name} found in GTFS zip`)
  }

  const stream = new TransformStream()
  entry.getData!(stream.writable)
  return csv(params).fromStream(new ReadableWebToNodeStream(stream.readable) as any)
}

async function getTransformedCsvForEntry<T>(
  entries: Entry[],
  name: string,
  transform: (input: any) => T
): Promise<T[]> {
  const results: T[] = [ ]
  await getStreamForEntry(entries, name, {
    needEmitAll: false
  }).subscribe(row => {
    results.push(transform(row))
  })

  return results
}

function assertFloat(value: string) {
  const parsed = parseFloat(value)
  if (isNaN(parsed)) {
    throw new Error(`Expected float, got ${value}`)
  }

  return parsed
}

export async function importToRepository(
  repository: GTFSRepository,
  overrides: ImportProfile["gtfsOverrides"],
  blob: Blob,
  progress?: (message: string) => void
) {
  const blobReader = new BlobReader(blob)
  const zipReader = new ZipReader(blobReader)

  const entries = await zipReader.getEntries()

  await repository.clearAll()

  progress?.("Importing stops...")

  const stops = await getTransformedCsvForEntry(entries, "stops.txt", stop => {
    if (overrides?.stops?.[stop.stop_id]) {
      stop = { ...stop, ...overrides.stops[stop.stop_id] }
    }

    return {
      id: stop.stop_id,
      code: stop.stop_code,
      name: stop.stop_name,
      desc: stop.stop_desc,
      lat: assertFloat(stop.stop_lat),
      lon: assertFloat(stop.stop_lon),
      zoneId: stop.zone_id,
      url: stop.stop_url,
      locationType: stop.location_type,
      parentStation: stop.parent_station,
      timezone: stop.stop_timezone,
      wheelchairBoarding: stop.wheelchair_boarding
    }
  })

  await repository.stops.bulkAdd(stops)

  progress?.("Importing routes...")

  const routes = await getTransformedCsvForEntry(entries, "routes.txt", route => {
    if (overrides?.routes && overrides.routes[route.route_id]) {
      route = { ...route, ...overrides.routes[route.route_id] }
    }

    return {
      id: route.route_id,
      agencyId: route.agency_id,
      shortName: route.route_short_name,
      longName: route.route_long_name,
      desc: route.route_desc,
      type: route.route_type,
      url: route.route_url,
      color: route.route_color,
      textColor: route.route_text_color,
      sortOrder: route.route_sort_order
    }
  })

  await repository.routes.bulkAdd(routes)

  progress?.("Importing trips...")

  const trips = await getTransformedCsvForEntry(entries, "trips.txt", trip => ({
    id: trip.trip_id,
    routeId: trip.route_id,
    serviceId: trip.service_id,
    shapeId: trip.shape_id,
    headsign: trip.trip_headsign,
    directionId: trip.direction_id,
    blockId: trip.block_id,
  }))

  await repository.trips.bulkAdd(trips)

  progress?.("Importing stop times...")

  const tripStops = new Map<string, string[]>()
  await getStreamForEntry(entries, "stop_times.txt", {
    needEmitAll: false
  }).subscribe(async stopTime => {
    if (!tripStops.has(stopTime.trip_id)) {
      tripStops.set(stopTime.trip_id, [])
    }
    tripStops.get(stopTime.trip_id)!.push(stopTime.stop_id)
  })

  await repository.tripStops.bulkAdd(
    Array.from(tripStops.entries())
    .map(([ tripId, stopIds ]) => ({ tripId, stopIds }))
  )
}
