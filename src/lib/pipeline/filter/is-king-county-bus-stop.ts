import type { OverpassElement } from "$lib/osm/overpass"

export const isKingCountyBusStop = (element: OverpassElement) => (
  element.tags["public_transport"] !== "stop_position" &&
  (
    element.tags["operator"]?.includes("King County Metro") ||
    element.tags["operator"] === undefined
  )
    &&
  (
    element.tags["bus"] === "yes" ||
    element.tags["highway"] === "bus_stop" ||
    element.tags["disused:highway"] === "bus_stop"
  )
)
