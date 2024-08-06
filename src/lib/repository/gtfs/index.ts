import Dexie, { type EntityTable } from "dexie"
import GTFSStop from "./stop"
import GTFSRoute from "./route"
import GTFSStopTime from "./stop-time"
import GTFSTrip from "./trip"

export interface IGTFSRepository {
  
}

export default class GTFSRepository extends Dexie implements IGTFSRepository {
  stops!: EntityTable<GTFSStop, "id">
  stopTimes!: EntityTable<GTFSStopTime, "tripId">
  routes!: EntityTable<GTFSRoute, "id">
  trips!: EntityTable<GTFSTrip, "id">

  constructor() {
    super("GTFSRepository")
    this.version(1).stores({
      stops: "id, &code",
      stopTimes: "[tripId+stopSequence], tripId, stopId",
      routes: "id, agencyId",
      trips: "id, routeId, serviceId, shapeId"
    })

    this.stops.mapToClass(GTFSStop)
    this.stopTimes.mapToClass(GTFSStopTime)
    this.routes.mapToClass(GTFSRoute)
    this.trips.mapToClass(GTFSTrip)
  }
}
