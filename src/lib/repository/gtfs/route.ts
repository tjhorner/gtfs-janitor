import { Entity } from "dexie"
import type GTFSRepository from "."

export const GTFSRouteType = {
  TRAM: "0",
  SUBWAY: "1",
  RAIL: "2",
  BUS: "3",
  FERRY: "4",
  CABLE_CAR: "5",
  GONDOLA: "6",
  FUNICULAR: "7",
  TROLLEYBUS: "11",
  MONORAIL: "12"
} as const

export interface IGTFSRoute {
  id: string
  agencyId: string
  shortName: string
  longName: string
  desc: string
  type: typeof GTFSRouteType[keyof typeof GTFSRouteType]
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
  type!: typeof GTFSRouteType[keyof typeof GTFSRouteType]
  url!: string
  color!: string
  textColor!: string
}
