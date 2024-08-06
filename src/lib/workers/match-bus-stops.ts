import type { Node } from "$lib/osm/overpass"
import { matchManyBusStops, type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
import GTFSRepository from "$lib/repository/gtfs"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"

export interface MatchBusStopsRequest {
  candidates: Node[]
}

export type MatchBusStopsResponse = {
  type: "match",
  match: MatchedBusStop
} | {
  type: "complete"
}

const sendResponse = (response: MatchBusStopsResponse) => {
  postMessage(response)
}

addEventListener("message", async (event: MessageEvent<MatchBusStopsRequest>) => {
  const { candidates } = event.data

  const repository = new GTFSRepository()

  let stopsToProcess: IGTFSStop[] = await repository.stops.toArray()
  let pendingMatches: MatchedBusStop[] = [ ]
  let definiteMatchesFound = true

  while (definiteMatchesFound) {
    definiteMatchesFound = false
    pendingMatches = [ ]

    const stopsToReprocess: IGTFSStop[] = [ ]

    const matches = matchManyBusStops(candidates, stopsToProcess)
    for (const { stop, match } of matches) {
      // We want to re-process ambiguous matches after
      // all definite matches have been found to see if
      // one stop's definite match resolves another's ambiguity
      if (match?.ambiguous) {
        stopsToReprocess.push(stop)
        pendingMatches.push({ stop, match })
      } else {
        sendResponse({
          type: "match",
          match: { stop, match }
        })
      }

      if (match && !match.ambiguous) {
        const matchedNodeIndex = candidates.findIndex(e => e.id === match.element.id)
        if (matchedNodeIndex > -1) {
          candidates.splice(matchedNodeIndex, 1)
        } else {
          console.warn("Could not remove node from candidate pool since it was not found")
        }

        definiteMatchesFound = true
      }
    }

    stopsToProcess = stopsToReprocess
  }

  // Only send ambiguous matches after we're sure that
  // all definite matches have been found
  for (const match of pendingMatches) {
    sendResponse({ type: "match", match })
  }

  sendResponse({ type: "complete" })
})
