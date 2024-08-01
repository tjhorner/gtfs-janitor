import type { Way } from "$lib/osm/overpass"

export const isRoadWay = (element: Way) => (
  element.tags &&
  !!element.tags["highway"] &&
  [ "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service" ].includes(element.tags["highway"])
)