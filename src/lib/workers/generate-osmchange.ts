import { OsmChangeFile, type OsmChanges } from "$lib/osm/osmchange"
import type { Node } from "$lib/osm/overpass"
import { applyDisambiguationActions } from "$lib/pipeline/actions/apply-disambiguation-results"
import { processStopMatches } from "$lib/pipeline/actions/process-stop-matches"
import { removeOldStops } from "$lib/pipeline/actions/remove-old-stops"
import type { DisambiguationResults } from "$lib/pipeline/disambiguator/session"
import GTFSRepository from "$lib/repository/gtfs"
import type { Draft } from "immer"
import memoize from "memoize"

export interface OsmChangeOptions {
  createNewStops: boolean
  updateExistingStops: boolean
  removeStagedForDeletion: boolean
  removeOldStops: boolean
  additionalTags: Record<string, string>
}

export interface GenerateOsmChangeRequest {
  disambiguationResults: Draft<DisambiguationResults>
  disusedStopCandidates: Node[]
  opts: OsmChangeOptions
}

export interface GenerateOsmChangeResponse {
  type: "osmchange"
  osmChange: OsmChanges
}

const repository = new GTFSRepository()

const sendResponse = (response: GenerateOsmChangeResponse) => postMessage(response)

const generateWithRequest = memoize(async (req: GenerateOsmChangeRequest) => {
  const { disambiguationResults, disusedStopCandidates, opts } = req

  const file = new OsmChangeFile()

  if (opts.removeStagedForDeletion) {
    applyDisambiguationActions(disambiguationResults, file)
  }

  console.time("processStopMatches")
  await processStopMatches(disambiguationResults.matches, file, repository, {
    createNodes: opts.createNewStops,
    updateNodes: opts.updateExistingStops,
    additionalTags: opts.additionalTags
  })
  console.timeEnd("processStopMatches")

  if (opts.removeOldStops) {
    removeOldStops(disambiguationResults.matches, disusedStopCandidates, file)
  }

  return file
}, {
  cacheKey: ([ req ]) => JSON.stringify(req.opts)
})

addEventListener("message", async (event: MessageEvent<GenerateOsmChangeRequest>) => {
  const file = await generateWithRequest(event.data)
  sendResponse({ type: "osmchange", osmChange: file })
})