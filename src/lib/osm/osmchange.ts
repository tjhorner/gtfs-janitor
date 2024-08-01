import xml from "xml"
import { isNode, type OverpassElement } from "./overpass"

export class OsmChangeFile {
  #additions: any[] = []
  #modifications: any[] = []
  #deletions: any[] = []

  get additions() { return Object.freeze(this.#additions) }
  get modifications() { return Object.freeze(this.#modifications) }
  get deletions() { return Object.freeze(this.#deletions) }

  #representAsXml(element: OverpassElement) {
    return {
      [element.type]: [
        {
          _attr: {
            id: element.id,
            version: "1",
            ...(isNode(element) ? { lat: element.lat, lon: element.lon } : { })
          }
        },
        ...Object.entries(element.tags).map(([key, value]) => ({ tag: [{ _attr: { k: key, v: value } }] }))
      ]
    }
  }

  addElement(element: OverpassElement) {
    this.#additions.push(this.#representAsXml(element))
  }

  modifyElement(element: OverpassElement) {
    this.#modifications.push(this.#representAsXml(element))
  }

  deleteElement(element: OverpassElement) {
    this.#deletions.push(this.#representAsXml(element))
  }

  generate(): string {
    return xml([
      {
        osmChange: [
          {
            _attr: {
              version: "0.6",
              generator: "gtfs-janitor"
            }
          },
          {
            create: this.#additions
          },
          {
            modify: this.#modifications
          },
          {
            delete: this.#deletions
          }
        ]
      }
    ])
  }
}
