import type { OverpassElement } from "$lib/osm/overpass"
import { applyPatches, produceWithPatches, type Immutable, type Patch, type WritableDraft } from "immer"
import type { MatchedBusStop } from "../matcher/bus-stops"

export type DisambiguationAction = "ignore" | "match" | "delete"

export interface DisambiguationSession {
  results: DisambiguationResults
  undoStack: {
    actions: DisambiguationAction[]
    patches: Patch[]
  }[]
}

export type DisambiguationResults = Immutable<{
  matches: MatchedBusStop[]
  deletions: OverpassElement[]
}>

export function startDisambiguationSession(initialMatches: MatchedBusStop[]): DisambiguationSession {
  return {
    results: {
      matches: initialMatches,
      deletions: [ ]
    },
    undoStack: [ ]
  }
}

function removeNodeFromMatches(draft: WritableDraft<DisambiguationResults>, nodeId: number) {
  for (const matchedStop of draft.matches) {
    const match = matchedStop.match
    if (!match?.ambiguous) continue

    const nodeIndex = match.elements.findIndex(el => el.id === nodeId)
    if (nodeIndex !== -1) {
      match.elements.splice(nodeIndex, 1)
    }
  }
}

function autoDisambiguateRemainingMatches(draft: WritableDraft<DisambiguationResults>) {
  for (const matchedStop of draft.matches) {
    const match = matchedStop.match
    if (!match?.ambiguous) continue

    if (match.elements.length === 0) {
      matchedStop.match = null
    }

    if (!match.alwaysAmbiguous && match.elements.length === 1) {
      matchedStop.match = {
        ambiguous: false,
        matchedBy: "human",
        element: match.elements[0]
      }
    }
  }
}

export function applyDisambiguationActions(
  session: DisambiguationSession,
  matchIndex: number,
  actions: DisambiguationAction[]
) {
  const [ nextState, _, inversePatches ] = produceWithPatches(session.results, draft => {
    const currentMatch = draft.matches[matchIndex].match
    if (!currentMatch?.ambiguous) {
      return
    }

    const matchCandidates = currentMatch.elements

    const matchedCandidateIndex = actions.findIndex(action => action === "match")
    if (matchedCandidateIndex !== -1) {
      const matchedCandidate = matchCandidates[matchedCandidateIndex]
      draft.matches[matchIndex].match = {
        ambiguous: false,
        matchedBy: "human",
        element: matchedCandidate
      }
    } else {
      draft.matches[matchIndex].match = null
    }

    actions.forEach((action, index) => {
      if (action === "delete") {
        draft.deletions.push(matchCandidates[index])
      }

      if (action !== "ignore") {
        removeNodeFromMatches(draft, matchCandidates[index].id)
      }
    })

    autoDisambiguateRemainingMatches(draft)
  })

  session.results = nextState
  session.undoStack.push({
    actions: [ ...actions ],
    patches: inversePatches
  })

  return session
}

export function undoDisambiguationActions(session: DisambiguationSession): [ DisambiguationSession, DisambiguationAction[] | null ] {
  const lastAction = session.undoStack.pop()
  if (!lastAction) {
    return [ session, null ]
  }

  session.results = applyPatches(session.results, lastAction.patches)
  return [ session, lastAction.actions ]
}
