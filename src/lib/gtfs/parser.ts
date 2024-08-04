import type { GTFSData, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip } from "./types"
import { BlobReader, ZipReader, type Entry } from "@zip.js/zip.js"
import { ReadableWebToNodeStream } from "readable-web-to-node-stream"
import { getRoutesServingStopIds } from "./util"
import csv from "csvtojson/v2"

async function parseEntryAsCsv<T = any>(entries: Entry[], name: string): Promise<T[]> {
  const entry = entries.find(entry => entry.filename === name)
  if (!entry) {
    throw new Error(`No file named ${name} found in GTFS zip`)
  }

  const stream = new TransformStream()
  entry.getData!(stream.writable)
  return await csv().fromStream(new ReadableWebToNodeStream(stream.readable) as any)
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