import type { Node } from "$lib/osm/overpass"
import { GTFSRouteType, type IGTFSRoute } from "$lib/repository/gtfs/route"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"

export function makeTestNode(props: Partial<Node> = { }): Node {
  return {
    type: "node",
    id: 1,
    lat: 0,
    lon: 0,
    tags: { },
    changeset: 0,
    version: 0,
    ...props,
  }
}

export function makeTestStop(props: Partial<IGTFSStop> = { }): IGTFSStop {
  return {
    id: "12345",
    code: "54321",
    name: "Main St & 1st Ave",
    desc: "Main Street and 1st Avenue",
    lat: 47.676731074603886,
    lon: -122.12513655172663,
    zoneId: "123",
    url: "http://example.com",
    locationType: "0",
    parentStation: "",
    timezone: "America/Los_Angeles",
    wheelchairBoarding: "1",
    ...props
  }
}

export function makeTestRoute(props: Partial<IGTFSRoute> = { }): IGTFSRoute {
  return {
    id: "1",
    agencyId: "1",
    shortName: "1",
    longName: "Route 1",
    desc: "Route 1",
    type: GTFSRouteType.BUS,
    color: "FF0000",
    textColor: "FFFFFF",
    url: "",
    ...props
  }
}