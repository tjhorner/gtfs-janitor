import { Entity } from "dexie"
import type GTFSRepository from "."

export interface IGTFSTrip {
  id: string
  routeId: string
  serviceId: string
  headsign: string
  directionId: string
  blockId: string
  shapeId: string
}

export default class GTFSTrip extends Entity<GTFSRepository> implements IGTFSTrip {
  id!: string
  routeId!: string
  serviceId!: string
  headsign!: string
  directionId!: string
  blockId!: string
  shapeId!: string
}
