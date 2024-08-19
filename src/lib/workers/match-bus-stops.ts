import type { Node } from "$lib/osm/overpass"
import type { MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
import GTFSRepository from "$lib/repository/gtfs"
import { matchBusStopsToNodes } from "$lib/use-cases/match-bus-stops"

export interface MatchBusStopsRequest {
  candidates: Node[]
}

export type MatchBusStopsResponse = {
  type: "match",
  match: MatchedBusStop
} | {
  type: "complete"
}

const sendResponse = (response: MatchBusStopsResponse) => postMessage(response)

addEventListener("message", async (event: MessageEvent<MatchBusStopsRequest>) => {
  const { candidates } = event.data
  const repository = new GTFSRepository()

  const gtfsStops = await repository.stops.toArray()
  for (const match of matchBusStopsToNodes(gtfsStops, candidates)) {
    sendResponse({ type: "match", match })
  }

  sendResponse({ type: "complete" })
})
