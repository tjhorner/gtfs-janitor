import { Entity } from "dexie"
import type GTFSRepository from "."

export interface IGTFSTripStops {
  tripId: string
  stopIds: string[]
}

export default class GTFSStopTime extends Entity<GTFSRepository> implements IGTFSTripStops {
  tripId!: string
  stopIds!: string[]
}
