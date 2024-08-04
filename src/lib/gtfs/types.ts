export interface GTFSStop {
  stop_id: string
  stop_code: string
  stop_name: string
  stop_desc: string
  stop_lat: number
  stop_lon: number
  zone_id: string
  stop_url: string
  location_type: string
  parent_station: string
  stop_timezone: string
  wheelchair_boarding: string
  routesServingStop?: GTFSRoute[]
}

export interface GTFSStopTime {
  trip_id: string
  arrival_time: string
  departure_time: string
  stop_id: string
  stop_sequence: string
  stop_headsign: string
  pickup_type: string
  drop_off_type: string
  shape_dist_traveled: string
}

export const GTFSRouteType = {
  TRAM: "0",
  SUBWAY: "1",
  RAIL: "2",
  BUS: "3",
  FERRY: "4",
  CABLE_CAR: "5",
  GONDOLA: "6",
  FUNICULAR: "7"
} as const

export interface GTFSRoute {
  route_id: string
  agency_id: string
  route_short_name: string
  route_long_name: string
  route_desc: string
  route_type: typeof GTFSRouteType[keyof typeof GTFSRouteType]
  route_url: string
  route_color: string
  route_text_color: string
}

export interface GTFSTrip {
  route_id: string
  service_id: string
  trip_id: string
  trip_headsign: string
  direction_id: string
  block_id: string
  shape_id: string
}

export interface GTFSData {
  readonly stops: GTFSStop[]
}
