import { describe, expect, it } from "vitest"
import type { DisambiguationResults } from "../disambiguator/session"
import { makeTestNode } from "$lib/util/test"
import { OsmChangeFile } from "$lib/osm/osmchange"
import { applyDisambiguationResults } from "./apply-disambiguation-results"

describe("applyDisambiguationResults", () => {
  it("applies deletions from a disambiguation session to an osmChange file", () => {
    // Arrange
    const results: DisambiguationResults = {
      matches: [ ],
      deletions: [ makeTestNode({ id: 1 }) ]
    }

    const osmChange = new OsmChangeFile()

    // Act
    applyDisambiguationResults(results, osmChange)

    // Assert
    expect(osmChange.deletions).toHaveLength(1)
    expect(osmChange.deletions[0]).toMatchObject({ id: 1 })
  })
})