import { Entity } from "dexie"
import type { IGTFSRoute } from "./route"
import type GTFSRepository from "."

export interface IGTFSStop {
  id: string
  code: string
  name: string
  desc: string
  lat: number
  lon: number
  zoneId: string
  url: string
  locationType: string
  parentStation: string
  timezone: string
  wheelchairBoarding: string
}

export default class GTFSStop extends Entity<GTFSRepository> implements IGTFSStop {
  id!: string
  code!: string
  name!: string
  desc!: string
  lat!: number
  lon!: number
  zoneId!: string
  url!: string
  locationType!: string
  parentStation!: string
  timezone!: string
  wheelchairBoarding!: string

  async getRoutesServingStop(): Promise<IGTFSRoute[]> {
    return this.db.getRoutesServingStop(this.id)
  }
}
