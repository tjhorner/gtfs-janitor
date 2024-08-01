import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js"
import csv from "csvtojson/v2"

export interface GTFSStop {
  stop_id: string
  stop_code: string
  stop_name: string
  stop_desc: string
  stop_lat: number
  stop_lon: number
  zone_id: string
  stop_url: string
  location_type: string
  parent_station: string
  stop_timezone: string
  wheelchair_boarding: string
}

export interface GTFSData {
  readonly stops: GTFSStop[]
}

async function parseStops(routesCsv: string): Promise<GTFSStop[]> {
  const stops = await csv().fromString(routesCsv)
  return stops.map(stop => ({
    ...stop,
    stop_lat: parseFloat(stop.stop_lat),
    stop_lon: parseFloat(stop.stop_lon)
  }))
}

export async function readGtfsZip(blob: Blob): Promise<GTFSData> {
  const blobReader = new BlobReader(blob)
  const zipReader = new ZipReader(blobReader)

  const entries = await zipReader.getEntries()

  const stopsCsv = entries.find(entry => entry.filename === "stops.txt")
  if (!stopsCsv) {
    throw new Error("No stops.txt found in GTFS zip")
  }

  const stopsCsvData = await stopsCsv.getData!(new TextWriter())
  const stops = await parseStops(stopsCsvData)

  return {
    stops
  }
}