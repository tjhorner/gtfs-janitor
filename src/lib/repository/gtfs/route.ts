import { Entity } from "dexie"
import type GTFSRepository from "."

export interface IGTFSRoute {
  id: string
  agencyId: string
  shortName: string
  longName: string
  desc: string
  type: number
  url: string
  color: string
  textColor: string
}

export default class GTFSRoute extends Entity<GTFSRepository> implements IGTFSRoute {
  id!: string
  agencyId!: string
  shortName!: string
  longName!: string
  desc!: string
  type!: number
  url!: string
  color!: string
  textColor!: string
}
