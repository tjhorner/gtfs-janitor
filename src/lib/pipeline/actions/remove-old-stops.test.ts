import { OsmChangeFile } from "$lib/osm/osmchange"
import { describe, expect, it } from "vitest"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { removeOldStops } from "./remove-old-stops"
import type { Node } from "$lib/osm/overpass"
import { makeTestNode, makeTestStop } from "$lib/util/test"

describe("removeOldStops", () => {
  const definiteMatch = Object.freeze({
    stop: makeTestStop(),
    match: {
      ambiguous: false,
      matchedBy: "test",
      element: makeTestNode()
    }
  } as const)

  it("adds disused: prefixes to nodes that haven't been matched with a stop", () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [ definiteMatch ]
    const candidatesForRemoval = [
      makeTestNode(),
      makeTestNode({
        id: 54321,
        tags: {
          "highway": "bus_stop",
          "railway": "tram_stop",
          "aerialway": "station",
          "amenity": "bus_station",
          "public_transport": "platform"
        }
      })
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