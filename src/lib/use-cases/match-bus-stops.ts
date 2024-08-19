import type { Node } from "$lib/osm/overpass"
import { matchManyBusStops, type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
import type { IGTFSStop } from "$lib/repository/gtfs/stop"

export function* matchBusStopsToNodes(
  stopsToMatch: IGTFSStop[],
  candidates: Node[]
): Generator<MatchedBusStop> {
  let stopsToProcess: IGTFSStop[] = stopsToMatch
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
        yield { match, stop }
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
    yield match
  }
}