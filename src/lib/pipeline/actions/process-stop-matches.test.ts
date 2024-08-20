import { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { GTFSRouteType, type IGTFSRoute } from "$lib/repository/gtfs/route"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"
import { describe, expect, it, vi } from "vitest"
import type { MatchedBusStop } from "../matcher/bus-stops"
import { processStopMatches, removeLifecyclePrefixes, tagsForOsmStop } from "./process-stop-matches"

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

const fullTestRoute: IGTFSRoute = Object.freeze({
  id: "1",
  agencyId: "1",
  shortName: "1",
  longName: "Route 1",
  desc: "Route 1",
  type: GTFSRouteType.BUS,
  color: "FF0000",
  textColor: "FFFFFF",
  url: ""
})

describe("tagsForOsmStop", () => {
  it("should return the correct tags for a given GTFS stop", () => {
    // Act
    const tags = tagsForOsmStop(fullTestStop, [ ])

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
    const gtfsStop: IGTFSStop = {
      ...fullTestStop,
      name: "  Main St &   1st Ave  "
    }

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
  ])("should assign the correct wheelchair tag", (wheelchairBoarding, expectedValue) => {
    // Arrange
    const gtfsStop: IGTFSStop = {
      ...fullTestStop,
      wheelchairBoarding
    }

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
  ])("should return the correct tags for the route types the stop serves", (routeType, expectedTags) => {
    // Arrange
    const busRoute: IGTFSRoute = {
      ...fullTestRoute,
      type: routeType
    }

    // Act
    const tags = tagsForOsmStop(fullTestStop, [ busRoute ])

    // Assert
    expect(tags).toMatchObject(expectedTags)
  })

  it("should return the correctly-sorted route_ref tag for a stop that serves multiple routes", () => {
    // Arrange
    const routes: IGTFSRoute[] = [
      { ...fullTestRoute, id: "2", shortName: "2" },
      { ...fullTestRoute, id: "3", shortName: "B" },
      { ...fullTestRoute, id: "4", shortName: "100" },
      { ...fullTestRoute, id: "1", shortName: "1" },
    ]

    // Act
    const tags = tagsForOsmStop(fullTestStop, routes)

    // Assert
    expect(tags).toMatchObject({
      "route_ref": "1;2;100;B"
    })
  })

  it("should set the local_ref for stops that are bays", () => {
    // Arrange
    const bayStop: IGTFSStop = {
      ...fullTestStop,
      name: "Fictional Transit Station - Bay 1"
    }

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
    stop: fullTestStop,
    match: {
      ambiguous: false,
      matchedBy: "test",
      element: {
        type: "node",
        id: 12345,
        lat: 0,
        lon: 0,
        changeset: 0,
        version: 1,
        tags: { }
      }
    }
  } as const)

  it("should create new nodes for unmatched stops", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      { stop: fullTestStop, match: null }
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
      { stop: fullTestStop, match: null }
    ]

    // Act
    await processStopMatches(stopMatches, osmChange, mockRepository, { })

    // Assert
    expect(osmChange.additions).toHaveLength(0)
  })

  it("should modify existing nodes that have been matched to stops", async () => {
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
        stop: fullTestStop,
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

  it("should reposition the node if the stop is >100m away", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      {
        stop: fullTestStop,
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

  it("shouldn't reposition the node if the stop is <=100m away", async () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    const stopMatches: MatchedBusStop[] = [
      {
        stop: fullTestStop,
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

  it("should render additional tags as static strings or Nunjucks templates", async () => {
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
