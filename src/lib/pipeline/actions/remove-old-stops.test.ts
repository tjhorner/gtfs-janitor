import { OsmChangeFile } from "$lib/osm/osmchange"
import { describe, expect, it } from "vitest"
import type { MatchedBusStop } from "../matcher/bus-stops"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { removeOldStops } from "./remove-old-stops"
import type { Node } from "$lib/osm/overpass"

describe("removeOldStops", () => {
  const fullTestStop: IGTFSStop = Object.freeze({
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
    wheelchairBoarding: "1"
  })

  const fullTestNode: Node = Object.freeze({
    type: "node",
    id: 12345,
    lat: 0,
    lon: 0,
    changeset: 0,
    version: 1,
    tags: { }
  })

  const definiteMatch = Object.freeze({
    stop: fullTestStop,
    match: {
      ambiguous: false,
      matchedBy: "test",
      element: fullTestNode
    }
  } as const)

  it("should add disused: prefixes to nodes that haven't been matched with a stop", () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [ definiteMatch ]
    const candidatesForRemoval = [
      fullTestNode,
      {
        ...fullTestNode,
        id: 54321,
        tags: {
          "highway": "bus_stop",
          "railway": "tram_stop",
          "aerialway": "station",
          "amenity": "bus_station",
          "public_transport": "platform"
        }
      }
    ]

    // Act
    removeOldStops(stopMatches, candidatesForRemoval, osmChange)

    // Assert
    expect(osmChange.modifications).toHaveLength(1)

    const node = osmChange.modifications[0] as Node
    expect(node.tags).toEqual({
      "disused:highway": "bus_stop",
      "disused:railway": "tram_stop",
      "disused:aerialway": "station",
      "disused:amenity": "bus_station",
      "disused:public_transport": "platform"
    })
  })
})