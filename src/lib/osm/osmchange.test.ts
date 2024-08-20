import { describe, expect, it } from "vitest"
import { OsmChangeFile } from "./osmchange"

describe("OsmChangeFile", () => {
  it("should generate a valid osmChange XML file", () => {
    // Arrange
    const osmChange = new OsmChangeFile()
    osmChange.addElement({
      type: "node",
      id: -1,
      lat: 47.6767241734473,
      lon: -122.12499134417357,
      changeset: -1,
      version: 1,
      tags: { "public_transport": "platform" }
    })

    osmChange.modifyElement({
      type: "node",
      id: 2,
      lat: 47.6767241734473,
      lon: -122.12499134417357,
      changeset: 1,
      version: 1,
      tags: { "public_transport": "platform" }
    })

    osmChange.deleteElement({
      type: "node",
      id: 3,
      lat: 47.6767241734473,
      lon: -122.12499134417357,
      changeset: 1,
      version: 1,
      tags: { "public_transport": "platform" }
    })

    // Act
    const xml = osmChange.generate()

    // Assert
    expect(xml).toEqual(`<osmChange version="0.6" generator="gtfs-janitor"><create><node id="-1" version="1" lat="47.6767241734473" lon="-122.12499134417357"><tag k="public_transport" v="platform"></tag></node></create><modify><node id="2" version="1" lat="47.6767241734473" lon="-122.12499134417357"><tag k="public_transport" v="platform"></tag></node></modify><delete><node id="3" version="1" lat="47.6767241734473" lon="-122.12499134417357"><tag k="public_transport" v="platform"></tag></node></delete></osmChange>`)
  })
})