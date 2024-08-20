import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { OverpassElement } from "$lib/osm/overpass"
import type { DisambiguationResults } from "../disambiguator/session"

export function applyDisambiguationResults(results: DisambiguationResults, osmChange: OsmChangeFile) {
  for (const deletion of results.deletions) {
    osmChange.deleteElement(deletion as OverpassElement)
  }
}
