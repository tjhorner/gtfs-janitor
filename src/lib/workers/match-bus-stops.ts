import type { GTFSStop } from "$lib/gtfs/parser"
import type { Node } from "$lib/osm/overpass"
import { matchBusStop, type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"

export interface MatchBusStopsRequest {
  stops: GTFSStop[]
  candidates: Node[]
}

addEventListener("message", async (event: MessageEvent<MatchBusStopsRequest>) => {
  const { stops, candidates } = event.data

  let stopsToProcess: GTFSStop[] = stops
  let pendingMatches: MatchedBusStop[] = [ ]
  let definiteMatchesFound = true

  while (definiteMatchesFound) {
    definiteMatchesFound = false
    pendingMatches = [ ]

    const stopsToReprocess: GTFSStop[] = [ ]

    for (const stop of stopsToProcess) {
      const match = matchBusStop(candidates, stop)

      // We want to re-process ambiguous matches after
      // all definite matches have been found to see if
      // one stop's definite match resolves another's ambiguity
      if (match?.ambiguous) {
        stopsToReprocess.push(stop)
        pendingMatches.push({ stop, match })
      } else {
        postMessage({ stop, match })
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
    postMessage(match)
  }
})
