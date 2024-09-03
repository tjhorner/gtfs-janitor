import xml from "xml"
import { isNode, type OverpassElement } from "./overpass"

export interface OsmChanges {
  additions: any[]
  modifications: any[]
  deletions: any[]
}

export interface ChangedElement {
  [x: string]: (
    | { tag: { _attr: { k: string; v: string | undefined } }[] }
    | {
        _attr: {
          lat?: number | undefined
          lon?: number | undefined
          id: number
          version: string
        }
      }
  )[]
}

export class OsmChangeFile implements OsmChanges {
  additions: OverpassElement[] = []
  modifications: OverpassElement[] = []
  deletions: OverpassElement[] = []

  static from(changes: OsmChanges) {
    const osmChange = new OsmChangeFile()
    osmChange.additions = changes.additions
    osmChange.modifications = changes.modifications
    osmChange.deletions = changes.deletions
    return osmChange
  }

  #representAsXml(element: OverpassElement): ChangedElement {
    return {
      [element.type]: [
        {
          _attr: {
            id: element.id,
            version: element.version.toString(),
            ...(isNode(element) ? { lat: element.lat, lon: element.lon } : {})
          }
        },
        ...Object.entries(element.tags).map(([key, value]) => ({ tag: [{ _attr: { k: key, v: value } }] }))
      ]
    }
  }

  #checkForDuplicateId(element: OverpassElement, array: OverpassElement[]) {
    const dupe = array.find(e => e.id === element.id)
    if (dupe) {
      console.warn(`Duplicate ID ${element.id} found in osmChange file`)
      console.warn(element, dupe)
    }
  }

  addElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.additions)
    this.additions.push(element)
  }

  modifyElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.modifications)
    this.modifications.push(element)
  }

  deleteElement(element: OverpassElement) {
    this.#checkForDuplicateId(element, this.deletions)
    this.deletions.push(element)
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
            create: this.additions.map(this.#representAsXml)
          },
          {
            modify: this.modifications.map(this.#representAsXml)
          },
          {
            delete: this.deletions.map(this.#representAsXml)
          }
        ]
      }
    ])
  }
}
