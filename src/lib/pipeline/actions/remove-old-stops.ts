import type { OsmChangeFile } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { type MatchedBusStop } from "../matcher/bus-stops"

export function removeOldStops(
  stopMatches: MatchedBusStop[],
  allCandidateNodes: readonly Node[],
  osmChange: OsmChangeFile
) {
  const stopIds = new Set(stopMatches.flatMap(({ stop }) => [ stop.stop_id, stop.stop_code ]))

  const nodesToDelete = allCandidateNodes
    .filter(node => (
      (
        node.tags["ref"] &&
        !stopIds.has(node.tags["ref"])
      )
        ||
      (
        node.tags["gtfs:stop_id"] &&
        !stopIds.has(node.tags["gtfs:stop_id"])
      )
    ))

  for (const node of nodesToDelete) {
    const modifiedNode = structuredClone(node)

    const addLifecyclePrefixToKeys = [ "highway", "public_transport" ]
    for (const key of addLifecyclePrefixToKeys) {
      if (modifiedNode.tags[key]) {
        modifiedNode.tags[`disused:${key}`] = modifiedNode.tags[key]
        delete modifiedNode.tags[key]
      }
    }

    osmChange.modifyElement(modifiedNode)
  }
}