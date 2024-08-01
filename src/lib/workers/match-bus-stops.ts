import type { GTFSStop } from "$lib/gtfs/parser"
import type { Node } from "$lib/osm/overpass"
import { matchBusStop } from "$lib/pipeline/matcher/bus-stops"

export interface MatchBusStopsRequest {
  stops: GTFSStop[]
  candidates: Node[]
}

addEventListener("message", async (event: MessageEvent<MatchBusStopsRequest>) => {
  const { stops, candidates } = event.data
  for (const stop of stops) {
    const match = matchBusStop(candidates, stop)
    postMessage({ stop, match })
  }
})