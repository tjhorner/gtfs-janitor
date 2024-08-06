import type { GTFSData, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip } from "./types"
import { BlobReader, ZipReader, type Entry } from "@zip.js/zip.js"
import { ReadableWebToNodeStream } from "readable-web-to-node-stream"
import { getRoutesServingStopIds } from "./util"
import csv from "csvtojson/v2"
import type GTFSRepository from "$lib/repository/gtfs"
import type { IGTFSStopTime } from "$lib/repository/gtfs/stop-time"

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

export async function readGtfsZip(blob: Blob): Promise<GTFSData> {
  const blobReader = new BlobReader(blob)
  const zipReader = new ZipReader(blobReader)

  const entries = await zipReader.getEntries()

  const stops = (await parseEntryAsCsv(entries, "stops.txt")).map(stop => ({
    ...stop,
    stop_lat: parseFloat(stop.stop_lat),
    stop_lon: parseFloat(stop.stop_lon)
  }) as GTFSStop)

  const stopTimes = await parseEntryAsCsv<GTFSStopTime>(entries, "stop_times.txt")
  const routes = await parseEntryAsCsv<GTFSRoute>(entries, "routes.txt")
  const trips = await parseEntryAsCsv<GTFSTrip>(entries, "trips.txt")

  const stopIdsToRoutes = getRoutesServingStopIds(trips, routes, stopTimes)
  stops.forEach(stop => {
    stop.routesServingStop = Array.from(stopIdsToRoutes.get(stop.stop_id) ?? [])
  })

  return { stops }
}

export async function importToRepository(
  repository: GTFSRepository,
  blob: Blob,
  progress?: () => void
) {
  const blobReader = new BlobReader(blob)
  const zipReader = new ZipReader(blobReader)

  const entries = await zipReader.getEntries()

  await repository.delete({ disableAutoOpen: false })

  await repository.transaction(
    "rw",
    repository.stops,
    repository.stopTimes,
    repository.routes,
    repository.trips,
  async () => {
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
    await repository.stops.bulkAdd(stops)

    const routes = (await parseEntryAsCsv(entries, "routes.txt")).map(route => ({
      id: route.route_id,
      agencyId: route.agency_id,
      shortName: route.route_short_name,
      longName: route.route_long_name,
      desc: route.route_desc,
      type: parseInt(route.route_type),
      url: route.route_url,
      color: route.route_color,
      textColor: route.route_text_color
    }))
    await repository.routes.bulkAdd(routes)

    const trips = (await parseEntryAsCsv(entries, "trips.txt")).map(trip => ({
      id: trip.trip_id,
      routeId: trip.route_id,
      serviceId: trip.service_id,
      shapeId: trip.shape_id,
      headsign: trip.trip_headsign,
      directionId: trip.direction_id,
      blockId: trip.block_id,
    }))
    await repository.trips.bulkAdd(trips)

    let stopTimesChunk: IGTFSStopTime[] = []

    const stopTimesStream = getStreamForEntry(entries, "stop_times.txt")
    await stopTimesStream.subscribe(async (stopTime: any) => {
      progress?.()
      stopTimesChunk.push({
        tripId: stopTime.trip_id,
        arrivalTime: stopTime.arrival_time,
        departureTime: stopTime.departure_time,
        stopId: stopTime.stop_id,
        stopSequence: parseInt(stopTime.stop_sequence),
        pickupType: stopTime.pickup_type,
        dropOffType: stopTime.drop_off_type,
        shapeDistTraveled: stopTime.shape_dist_traveled
      })

      if (stopTimesChunk.length >= 1000) {
        await repository.stopTimes.bulkAdd(stopTimesChunk)
        stopTimesChunk = [ ]
      }
    })

    if (stopTimesChunk.length > 0) {
      await repository.stopTimes.bulkAdd(stopTimesChunk)
    }
  })
}
