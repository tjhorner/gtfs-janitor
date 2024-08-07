import { BlobReader, ZipReader, type Entry } from "@zip.js/zip.js"
import { ReadableWebToNodeStream } from "readable-web-to-node-stream"
import csv from "csvtojson/v2"
import type GTFSRepository from "$lib/repository/gtfs"

async function parseEntryAsCsv<T = any>(entries: Entry[], name: string): Promise<T[]> {
  const entry = entries.find(entry => entry.filename === name)
  if (!entry) {
    throw new Error(`No file named ${name} found in GTFS zip`)
  }

  const stream = new TransformStream()
  entry.getData!(stream.writable)
  return csv().fromStream(new ReadableWebToNodeStream(stream.readable) as any)
}

function getStreamForEntry(entries: Entry[], name: string) {
  const entry = entries.find(entry => entry.filename === name)
  if (!entry) {
    throw new Error(`No file named ${name} found in GTFS zip`)
  }

  const stream = new TransformStream()
  entry.getData!(stream.writable)
  return csv().fromStream(new ReadableWebToNodeStream(stream.readable) as any)
}

export async function importToRepository(
  repository: GTFSRepository,
  blob: Blob
) {
  const blobReader = new BlobReader(blob)
  const zipReader = new ZipReader(blobReader)

  const entries = await zipReader.getEntries()

  const stops = (await parseEntryAsCsv(entries, "stops.txt")).map(stop => ({
    id: stop.stop_id,
    code: stop.stop_code,
    name: stop.stop_name,
    desc: stop.stop_desc,
    lat: parseFloat(stop.stop_lat),
    lon: parseFloat(stop.stop_lon),
    zoneId: stop.zone_id,
    url: stop.stop_url,
    locationType: stop.location_type,
    parentStation: stop.parent_station,
    timezone: stop.stop_timezone,
    wheelchairBoarding: stop.wheelchair_boarding
  }))

  const routes = (await parseEntryAsCsv(entries, "routes.txt")).map(route => ({
    id: route.route_id,
    agencyId: route.agency_id,
    shortName: route.route_short_name,
    longName: route.route_long_name,
    desc: route.route_desc,
    type: route.route_type,
    url: route.route_url,
    color: route.route_color,
    textColor: route.route_text_color
  }))

  const trips = (await parseEntryAsCsv(entries, "trips.txt")).map(trip => ({
    id: trip.trip_id,
    routeId: trip.route_id,
    serviceId: trip.service_id,
    shapeId: trip.shape_id,
    headsign: trip.trip_headsign,
    directionId: trip.direction_id,
    blockId: trip.block_id,
  }))

  const tripStops = new Map<string, string[]>()
  await getStreamForEntry(entries, "stop_times.txt").subscribe(async stopTime => {
    if (!tripStops.has(stopTime.trip_id)) {
      tripStops.set(stopTime.trip_id, [])
    }
    tripStops.get(stopTime.trip_id)!.push(stopTime.stop_id)
  })

  await repository.clearAll()

  await repository.transaction(
    "rw",
    repository.stops,
    repository.tripStops,
    repository.routes,
    repository.trips,
  async () => {
    await repository.stops.bulkAdd(stops)
    await repository.routes.bulkAdd(routes)
    await repository.trips.bulkAdd(trips)
    await repository.tripStops.bulkAdd(Array.from(tripStops.entries().map(([tripId, stopIds]) => ({ tripId, stopIds }))))
  })
}
