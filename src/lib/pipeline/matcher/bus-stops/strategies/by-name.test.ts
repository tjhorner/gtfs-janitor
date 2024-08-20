import { makeTestNode, makeTestStop } from "$lib/util/test"
import { describe, expect, it } from "vitest"
import { matchByNameStrategy } from "./by-name"

describe("matchByNameStrategy", () => {
  it.each([
    [ "name" ],
    [ "ref" ]
  ])("matches by exact %s key", (key) => {
    // Arrange
    const node = makeTestNode({
      tags: {
        [key]: "Main St & 1st Ave"
      }
    })

    const stop = makeTestStop({
      name: "Main St & 1st Ave"
    })

    // Act
    const result = matchByNameStrategy.match([ node ], stop)

    // Assert
    expect(result.elements).toEqual([ node ])
  })

  it("matches by normalized name", () => {
    // Arrange
    const node = makeTestNode({
      tags: {
        "name": "Main St & Northwest 1st Ave"
      }
    })

    const stop = makeTestStop({
      name: "main street and NW 1st   avenue  "
    })

    // Act
    const result = matchByNameStrategy.match([ node ], stop)

    // Assert
    expect(result.elements).toEqual([ node ])
  })

  it("marks exact matches that are far away as ambiguous", () => {
    // Arrange
    const node = makeTestNode({
      lat: 0,
      lon: 0,
      tags: {
        "name": "Main St & 1st Ave"
      }
    })

    const stop = makeTestStop({
      lat: 5,
      lon: 5,
      name: "Main St & 1st Ave"
    })

    // Act
    const result = matchByNameStrategy.match([ node ], stop)

    // Assert
    expect(result.elements).toEqual([ node ])
    expect(result.alwaysAmbiguous).toBe(true)
  })

  it("automatically disambiguates multiple matches if one is very close", () => {
    // Arrange
    const stop = makeTestStop({
      lat: 47.676731074603886,
      lon: -122.12513655172663,
      name: "Main St & 1st Ave"
    })

    const nodes = [
      makeTestNode({
        id: 1,
        lat: 0,
        lon: 0,
        tags: {
          "name": "Main St & 1st Ave"
        }
      }),
      makeTestNode({
        id: 2,
        lat: 47.67654409149954,
        lon: -122.12592120869819,
        tags: {
          "name": "Main St & 1st Ave"
        }
      })
    ]

    // Act
    const result = matchByNameStrategy.match(nodes, stop)

    // Assert
    expect(result.elements).toEqual([ nodes[1] ])
  })
})