import { isWay, type Node, type OverpassElement } from "$lib/osm/overpass"
import { isRoadWay } from "./is-road-way"

export function isNotRoadWayMember(setContainingWays: OverpassElement[]) {
  const roadWays = setContainingWays.filter(isWay).filter(isRoadWay)
  const nodesInRoadWays = new Set(roadWays.flatMap(way => way.nodes))
  return (element: Node) => !nodesInRoadWays.has(element.id)
}