import { describe, expect, it } from "vitest"
import { areNodesDifferent, areTagsDifferent } from "./util"
import type { Node } from "./overpass"

describe("areTagsDifferent", () => {
  it("returns true if there is a new tag", () => {
    // Arrange
    const before = { "key": "value" }
    const after = { "key": "value", "newKey": "newValue" }

    // Act
    const result = areTagsDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true if there is a removed tag", () => {
    // Arrange
    const before = { "key": "value", "removedKey": "removedValue" }
    const after = { "key": "value" }

    // Act
    const result = areTagsDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true if there is a modified tag", () => {
    // Arrange
    const before = { "key": "value" }
    const after = { "key": "newValue" }

    // Act
    const result = areTagsDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })

  it("returns false if there are no changes", () => {
    // Arrange
    const before = { "key": "value" }
    const after = { "key": "value" }

    // Act
    const result = areTagsDifferent(before, after)

    // Assert
    expect(result).toBe(false)
  })
})

describe("areNodesDifferent", () => {
  const referenceNode: Node = Object.freeze({
    type: "node",
    id: 12345,
    lat: 0,
    lon: 0,
    changeset: 0,
    version: 0,
    tags: { }
  })

  it("returns true if the latitude changes", () => {
    // Arrange
    const before = referenceNode
    const after = {
      ...referenceNode,
      lat: 1
    }

    // Act
    const result = areNodesDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true if the longitude changes", () => {
    // Arrange
    const before = referenceNode
    const after = {
      ...referenceNode,
      lon: 1
    }

    // Act
    const result = areNodesDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true if the tags change", () => {
    // Arrange
    const before = referenceNode
    const after = {
      ...referenceNode,
      tags: { "key": "value" }
    }

    // Act
    const result = areNodesDifferent(before, after)

    // Assert
    expect(result).toBe(true)
  })
})