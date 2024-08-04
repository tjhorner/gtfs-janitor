import type { GTFSRoute, GTFSStopTime, GTFSTrip } from "./types"

export function getRoutesServingStopIds(
  trips: GTFSTrip[],
  routes: GTFSRoute[],
  stopTimes: GTFSStopTime[]
): Map<string, Set<GTFSRoute>> {
  const tripIdsToRouteIds = new Map<string, string>()
  for (const trip of trips) {
    tripIdsToRouteIds.set(trip.trip_id, trip.route_id)
  }

  const routeIdsToRoute = new Map<string, GTFSRoute>()
  for (const route of routes) {
    routeIdsToRoute.set(route.route_id, route)
  }

  const stopIdsToRoutes = new Map<string, Set<GTFSRoute>>()
  for (const stopTime of stopTimes) {
    const routeId = tripIdsToRouteIds.get(stopTime.trip_id)
    if (!routeId) continue

    const route = routeIdsToRoute.get(routeId)
    if (!route) continue

    if (!stopIdsToRoutes.has(stopTime.stop_id)) {
      stopIdsToRoutes.set(stopTime.stop_id, new Set())
    }

    stopIdsToRoutes.get(stopTime.stop_id)!.add(route)
  }

  routeIdsToRoute.clear()
  tripIdsToRouteIds.clear()

  return stopIdsToRoutes
}
