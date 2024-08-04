import type { GTFSStop } from "$lib/gtfs/parser"
import { computeDestinationPoint, getDistance } from "geolib"

export function calculateDistanceMeters(lat1?: number, lon1?: number, lat2?: number, lon2?: number) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity
  }

  return getDistance(
    { lat: lat1, lon: lon1 },
    { lat: lat2, lon: lon2 }
  )
}

export function averageDistance(points: readonly { lat: number, lon: number }[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      total += calculateDistanceMeters(
        points[i].lat,
        points[i].lon,
        points[j].lat,
        points[j].lon
      )
    }
  }

  return total / (points.length * (points.length - 1) / 2)
}

export type BoundingBox = [ number, number, number, number ]

export function getStopsBoundingBox(stops: GTFSStop[]): BoundingBox {
  const lats = stops.map(stop => stop.stop_lat)
  const lons = stops.map(stop => stop.stop_lon)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  return [ minLat, minLon, maxLat, maxLon ]
}

export function expandBoundingBox(bbox: BoundingBox, distance: number): BoundingBox {
  const topLeftCorner = { lat: bbox[0], lon: bbox[1] }
  const expandedTopLeft = computeDestinationPoint(topLeftCorner, distance, 315)

  const bottomRightCorner = { lat: bbox[2], lon: bbox[3] }
  const expandedBottomRight = computeDestinationPoint(bottomRightCorner, distance, 135)

  return [
    expandedTopLeft.latitude,
    expandedTopLeft.longitude,
    expandedBottomRight.latitude,
    expandedBottomRight.longitude
  ]
}
