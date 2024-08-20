import { describe, expect, it } from "vitest"
import { matchByIdStrategy } from "./by-id"
import { makeTestNode, makeTestStop } from "$lib/util/test"

describe("matchByIdStrategy", () => {
  it.each([
    [ { "gtfs:stop_id": "12345" } ],
    [ { "ref": "54321" } ],
    [ { "gtfs:stop_id": "54321" } ],
    [ { "ref": "12345" } ],
  ])("matches stop ID or code with gtfs:stop_id or ref", (tags) => {
    // Arrange
    const node = makeTestNode({ tags })
    const stop = makeTestStop({
      id: "12345",
      code: "54321"
    })

    // Act
    const result = matchByIdStrategy.match([ node ], stop)

    // Assert
    expect(result.elements).toEqual([ node ])
  })

  it("marks matched nodes that are far away as alwaysAmbiguous", () => {
    // Arrange
    const stop = makeTestStop({
      id: "12345",
      lat: 47.676731074603886,
      lon: -122.12513655172663
    })

    const node = makeTestNode({
      lat: 47.687966828087006,
      lon: -121.44829344422597,
      tags: {
        "gtfs:stop_id": "12345"
      }
    })

    // Act
    const result = matchByIdStrategy.match([ node ], stop)

    // Assert
    expect(result.elements).toEqual([ node ])
    expect(result.alwaysAmbiguous).toBe(true)
  })

  it("narrows multiple matches by filtering to nodes that are <100m away", () => {
    // Arrange
    const stop = makeTestStop({
      id: "12345",
      lat: 47.676731074603886,
      lon: -122.12513655172663
    })

    const tags = { "gtfs:stop_id": "12345" }
    const nodes = [
      makeTestNode({
        id: 2,
        lat: 47.67654409149954,
        lon: -122.12592120869819,
        tags
      }),
      makeTestNode({
        id: 1,
        lat: 47.67725992478747,
        lon: -122.1243519610272,
        tags
      }),
      makeTestNode({
        id: 3,
        lat: 47.67629469354391,
        lon: -122.12217414315096,
        tags
      })
    ]

    // Act
    const result = matchByIdStrategy.match(nodes, stop)

    // Assert
    expect(result.elements).toHaveLength(2)
    expect(result.elements[0].id).toBe(nodes[0].id)
    expect(result.elements[1].id).toBe(nodes[1].id)
  })
})
