import type { IGTFSStop } from "$lib/repository/gtfs/stop"
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

export function getStopsBoundingBox(stops: IGTFSStop[]): BoundingBox {
  const lats = stops.map(stop => stop.lat)
  const lons = stops.map(stop => stop.lon)

  const minLat = Math.min(...lats)
  const minLon = Math.min(...lons)
  const maxLat = Math.max(...lats)
  const maxLon = Math.max(...lons)

  return [ minLat, minLon, maxLat, maxLon ]
}

export function expandBoundingBox(bbox: BoundingBox, distance: number): BoundingBox {
  const bottomLeftCorner = { lat: bbox[0], lon: bbox[1] }
  const expandedBottomLeft = computeDestinationPoint(bottomLeftCorner, distance, 225)

  const topRightCorner = { lat: bbox[2], lon: bbox[3] }
  const expandedTopRight = computeDestinationPoint(topRightCorner, distance, 45)

  return [
    expandedBottomLeft.latitude,
    expandedBottomLeft.longitude,
    expandedTopRight.latitude,
    expandedTopRight.longitude
  ]
}
