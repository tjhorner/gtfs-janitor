import Dexie, { type EntityTable, type Table } from "dexie"
import GTFSStop from "./stop"
import GTFSRoute, { type IGTFSRoute } from "./route"
import GTFSTripStop from "./trip-stops"
import GTFSTrip, { type IGTFSTrip } from "./trip"
import type { BoundingBox } from "$lib/util/geo-math"

export interface IGTFSRepository {
  getRoutesForAllStopIds(): Promise<Map<string, Set<IGTFSRoute>>>
}

export default class GTFSRepository extends Dexie implements IGTFSRepository {
  stops!: EntityTable<GTFSStop, "id">
  tripStops!: EntityTable<GTFSTripStop, "tripId">
  routes!: EntityTable<GTFSRoute, "id">
  trips!: Table<IGTFSTrip, [string, string]>

  constructor() {
    super("GTFSRepository")
    this.version(1).stores({
      stops: "id, code",
      tripStops: "tripId, *stopIds",
      routes: "id, agencyId",
      trips: "[id+routeId], id, routeId, serviceId, shapeId"
    })

    this.stops.mapToClass(GTFSStop)
    this.tripStops.mapToClass(GTFSTripStop)
    this.routes.mapToClass(GTFSRoute)
    this.trips.mapToClass(GTFSTrip)
  }

  async clearAll() {
    return this.transaction("rw", this.stops, this.tripStops, this.routes, this.trips, async () => {
      await this.stops.clear()
      await this.tripStops.clear()
      await this.routes.clear()
      await this.trips.clear()
    })
  }

  async getRoutesForAllStopIds(): Promise<Map<string, Set<IGTFSRoute>>> {
    return this.transaction("r", this.tripStops, this.trips, this.routes, async () => {
      const tripIdToRouteId = new Map<string, string>(await this.trips.toCollection().primaryKeys())

      const allRouteIds = Array.from(new Set(tripIdToRouteId.values()))
      const allRoutes = await this.routes.bulkGet(allRouteIds)
      const routeByRouteId = new Map(allRoutes.map(route => [route!.id, route!]))

      const stopIdsToRoutes = new Map<string, Set<IGTFSRoute>>()
      await this.tripStops.each(tripStop => {
        const routeId = tripIdToRouteId.get(tripStop.tripId)
        if (!routeId) return
    
        const route = routeByRouteId.get(routeId)
        if (!route) return

        for (const stopId of tripStop.stopIds) {
          if (!stopIdsToRoutes.has(stopId)) {
            stopIdsToRoutes.set(stopId, new Set())
          }

          stopIdsToRoutes.get(stopId)!.add(route)
        }
      })

      return stopIdsToRoutes
    })
  }

  async getRoutesServingStop(stopId: string): Promise<GTFSRoute[]> {
    return this.transaction("r", this.tripStops, this.trips, this.routes, async () => {
      const tripIds = await this.tripStops
        .where("stopIds")
        .equals(stopId)
        .primaryKeys()

      if (tripIds.length === 0) {
        return []
      }

      const routeIds = await this.trips
        .where("id")
        .anyOf(tripIds)
        .distinct()
        .primaryKeys(pks => pks.map(pk => pk[1]))

      if (routeIds.length === 0) {
        return []
      }

      return await this.routes
        .where("id")
        .anyOf(routeIds)
        .toArray()
    })
  }

  async getStopsBoundingBox(): Promise<BoundingBox> {
    const stops = await this.stops.toArray()

    const lats = stops.map(stop => stop.lat)
    const lons = stops.map(stop => stop.lon)
    return [
      Math.min(...lats),
      Math.min(...lons),
      Math.max(...lats),
      Math.max(...lons)
    ]
  }
}
