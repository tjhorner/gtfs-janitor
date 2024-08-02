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

  #checkForDuplicateId(element: OverpassElement, array: any[]) {
    const dupe = array.find(e => e[element.type][0]._attr.id === element.id)
    if (dupe) {
      console.warn(`Duplicate ID ${element.id} found in osmChange file`)
      console.warn(element, dupe)
    }
  }

  addElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.#additions)
    this.#additions.push(this.#representAsXml(element))
  }

  modifyElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.#modifications)
    this.#modifications.push(this.#representAsXml(element))
  }

  deleteElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.#deletions)
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
