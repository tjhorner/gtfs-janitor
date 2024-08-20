import { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { GTFSRouteType, type IGTFSRoute } from "$lib/repository/gtfs/route"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { describe, expect, it, vi } from "vitest"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { processStopMatches, removeLifecyclePrefixes, tagsForOsmStop } from "./process-stop-matches"
import { makeTestNode, makeTestRoute, makeTestStop } from "$lib/util/test"

describe("tagsForOsmStop", () => {
  it("returns the correct tags for a given GTFS stop", () => {
    // Act
    const tags = tagsForOsmStop(makeTestStop(), [ ])

    // Assert
    expect(tags).toEqual({
      "name": "Main St & 1st Ave",
      "ref": "54321",
      "gtfs:stop_id": "12345",
      "wheelchair": "yes",
      "website": "http://example.com"
    })
  })

  it("should remove extra spaces in the stop's name", () => {
    // Arrange
    const gtfsStop: IGTFSStop = makeTestStop({
      name: "  Main St &   1st Ave  "
    })

    // Act
    const tags = tagsForOsmStop(gtfsStop, [ ])

    // Assert
    expect(tags["name"]).toEqual("Main St & 1st Ave")
  })

  it.each([
    [ "1",               "yes" ],
    [ "2",               "no" ],
    [ "0",               undefined ],
    [ "any-other-value", undefined ]
  ])("assigns the correct wheelchair tag", (wheelchairBoarding, expectedValue) => {
    // Arrange
    const gtfsStop: IGTFSStop = makeTestStop({
      wheelchairBoarding
    })

    // Act
    const tags = tagsForOsmStop(gtfsStop, [ ])

    // Assert
    expect(tags["wheelchair"]).toEqual(expectedValue)
  })

  it.each([
    [ GTFSRouteType.BUS,        { "bus": "yes", "highway": "bus_stop" } ],
    [ GTFSRouteType.TROLLEYBUS, { "trolleybus": "yes", "highway": "bus_stop" } ],
    [ GTFSRouteType.TRAM,       { "tram": "yes", "railway": "tram_stop" } ],
    [ GTFSRouteType.FERRY,      { "ferry": "yes", "amenity": "ferry_terminal" } ],
    [ GTFSRouteType.GONDOLA,    { "aerialway": "station" } ],
    [ GTFSRouteType.FUNICULAR,  { "railway": "station", "station": "funicular" } ],
  ])("returns the correct tags for the route types the stop serves", (routeType, expectedTags) => {
    // Arrange
    const busRoute: IGTFSRoute = makeTestRoute({
      type: routeType
    })

    // Act
    const tags = tagsForOsmStop(makeTestStop(), [ busRoute ])

    // Assert
    expect(tags).toMatchObject(expectedTags)
  })

  it("returns the correctly-sorted route_ref tag for a stop that serves multiple routes", () => {
    // Arrange
    const routes: IGTFSRoute[] = [
      makeTestRoute({ id: "2", shortName: "2" }),
      makeTestRoute({ id: "3", shortName: "B" }),
      makeTestRoute({ id: "4", shortName: "100" }),
      makeTestRoute({ id: "1", shortName: "1" })
    ]

    // Act
    const tags = tagsForOsmStop(makeTestStop(), routes)

    // Assert
    expect(tags).toMatchObject({
      "route_ref": "1;2;100;B"
    })
  })

  it("sets the local_ref for stops that are bays", () => {
    // Arrange
    const bayStop: IGTFSStop = makeTestStop({
      name: "Fictional Transit Station - Bay 1"
    })

    // Act
    const tags = tagsForOsmStop(bayStop, [ ])

    // Assert
    expect(tags).toMatchObject({
      "local_ref": "1"
    })
  })
})

describe("removeLifecyclePrefixes", () => {
  it.each([
    [ "disused:" ],
    [ "abandoned:" ],
    [ "razed:" ],
    [ "demolished:" ],
    [ "removed:" ],
    [ "razed:" ],
    [ "ruins:" ],
    [ "destroyed:" ],
    [ "proposed:" ],
    [ "planned:" ],
    [ "construction:" ]
  ])("removes any key with a lifecycle prefix found in a list of tags", (prefix) => {
    // Arrange
    const tags = {
      [`${prefix}key1`]: "value1",
    }

    // Act
    const cleanedTags = removeLifecyclePrefixes(tags)

    // Assert
    expect(cleanedTags).toEqual({ })
  })
})

describe("processStopMatches", () => {
  const mockRepository = {
    getRoutesForAllStopIds: vi.fn(() => Promise.resolve(new Map()))
  }

  const definiteMatch = Object.freeze({
    stop: makeTestStop(),
    match: {
      ambiguous: false,
      matchedBy: "test",
      element: makeTestNode()
    }
  } as const)

  it("creates new nodes for unmatched stops", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      { stop: makeTestStop(), match: null }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { createNodes: true })

    // Assert
    expect(osmChange.additions).toHaveLength(1)

    const node = osmChange.additions[0] as Node
    expect(node.id).toBeLessThan(0)
    expect(node.lat).toEqual(47.676731074603886)
    expect(node.lon).toEqual(-122.12513655172663)
    expect(node.tags).toEqual({
      "public_transport": "platform",
      "name": "Main St & 1st Ave",
      "ref": "54321",
      "gtfs:stop_id": "12345",
      "wheelchair": "yes",
      "website": "http://example.com"
    })
  })

  it("should not create new nodes for unmatched stops if createNodes is not set", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      { stop: makeTestStop(), match: null }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { })

    // Assert
    expect(osmChange.additions).toHaveLength(0)
  })

  it("modifies existing nodes that have been matched to stops", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [ definiteMatch ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { updateNodes: true })

    // Assert
    expect(osmChange.modifications).toHaveLength(1)
  })

  it("should not modify existing nodes if updateNodes is not set", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [ definiteMatch ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { })

    // Assert
    expect(osmChange.modifications).toHaveLength(0)
  })

  it("should not modify existing nodes if tags don't need to change", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      {
        stop: makeTestStop(),
        match: {
          ...definiteMatch.match,
          element: {
            ...definiteMatch.match.element,
            lat: 47.676731074603886,
            lon: -122.12513655172663,
            tags: {
              "name": "Main St & 1st Ave",
              "ref": "54321",
              "gtfs:stop_id": "12345",
              "wheelchair": "yes",
              "website": "http://example.com"
            }
          }
        }
      }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { updateNodes: true })

    // Assert
    expect(osmChange.modifications).toHaveLength(0)
  })

  it("repositions the node if the stop is >100m away", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      {
        stop: makeTestStop(),
        match: {
          ...definiteMatch.match,
          element: { ...definiteMatch.match.element, lat: 0, lon: 0 }
        }
      }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { updateNodes: true })

    // Assert
    expect(osmChange.modifications).toHaveLength(1)

    const node = osmChange.modifications[0] as Node
    expect(node.lat).toEqual(47.676731074603886)
    expect(node.lon).toEqual(-122.12513655172663)
  })

  it("should not reposition the node if the stop is <=100m away", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      {
        stop: makeTestStop(),
        match: {
          ...definiteMatch.match,
          element: {
            ...definiteMatch.match.element,
            lat: 47.6767241734473,
            lon: -122.12499134417357
          }
        }
      }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { updateNodes: true })

    // Assert
    expect(osmChange.modifications).toHaveLength(1)

    const node = osmChange.modifications[0] as Node
    expect(node.lat).toEqual(47.6767241734473)
    expect(node.lon).toEqual(-122.12499134417357)
  })

  it("renders additional tags as static strings or Nunjucks templates", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [ definiteMatch ]
    const additionalTags = {
      "test": "{{ name | lower }}",
      "test2": "static string"
    }
    
    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { updateNodes: true, additionalTags })

    // Assert
    expect(osmChange.modifications).toHaveLength(1)

    const node = osmChange.modifications[0] as Node
    expect(node.tags).toMatchObject({
      "test": "main st & 1st ave",
      "test2": "static string"
    })
  })
})
