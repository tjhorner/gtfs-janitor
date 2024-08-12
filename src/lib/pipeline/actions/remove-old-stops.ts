import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { isDefiniteMatch, type MatchedBusStop } from "../matcher/bus-stops"

export function removeOldStops(
  stopMatches: MatchedBusStop[],
  candidatesForRemoval: readonly Node[],
  osmChange: OsmChangeFile
) {
  const definiteMatches = stopMatches
    .map(({ match }) => match)
    .filter((match) => isDefiniteMatch(match))

  const matchedNodeIds = new Set(definiteMatches.map((match) => match.element.id))
  const nodesToDelete = candidatesForRemoval.filter(node => !matchedNodeIds.has(node.id))

  for (const node of nodesToDelete) {
    const modifiedNode = structuredClone(node)

    const addLifecyclePrefixToKeys = [ "highway", "railway", "aerialway", "amenity", "public_transport" ]
    for (const key of addLifecyclePrefixToKeys) {
      if (modifiedNode.tags[key]) {
        modifiedNode.tags[`disused:${key}`] = modifiedNode.tags[key]
        delete modifiedNode.tags[key]
      }
    }

    osmChange.modifyElement(modifiedNode)
  }
}