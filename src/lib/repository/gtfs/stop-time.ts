import { Entity } from "dexie"
import type GTFSRepository from "."

export interface IGTFSStopTime {
  tripId: string
  arrivalTime: string
  departureTime: string
  stopId: string
  stopSequence: number
  pickupType: string
  dropOffType: string
  shapeDistTraveled: string
}

export default class GTFSStopTime extends Entity<GTFSRepository> implements IGTFSStopTime {
  tripId!: string
  arrivalTime!: string
  departureTime!: string
  stopId!: string
  stopSequence!: number
  pickupType!: string
  dropOffType!: string
  shapeDistTraveled!: string
}
