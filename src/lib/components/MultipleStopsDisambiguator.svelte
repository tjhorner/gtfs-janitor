<script lang="ts">
  import { applyDisambiguationActions, startDisambiguationSession, undoDisambiguationActions, type DisambiguationAction, type DisambiguationResults, type DisambiguationSession } from "$lib/pipeline/disambiguator/session"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { savedDisambiguationSession } from "$lib/stores/disambiguation-session"
  import type { Immutable } from "immer"
  import { createEventDispatcher, onMount } from "svelte"
  import StopDisambiguator from "./StopDisambiguator/StopDisambiguator.svelte"

  export let matchedStops: MatchedBusStop[] | undefined = undefined
  
  const dispatch = createEventDispatcher<{ done: Immutable<DisambiguationResults> }>()

  let initialActions: DisambiguationAction[] | undefined
  let session = startOrRestoreSession()
  let currentMatchIndex = -1

  function startOrRestoreSession() {
    if ($savedDisambiguationSession) return $savedDisambiguationSession

    const newSession = startDisambiguationSession(matchedStops ?? [ ])
    savedDisambiguationSession.set(newSession)
    return newSession
  }

  function goToNextAmbiguousMatch(withInitialActions?: DisambiguationAction[]) {
    const nextAmbiguousMatch = session.results.matches.findIndex(({ match }) => match?.ambiguous)
    if (nextAmbiguousMatch !== -1) {
      currentMatchIndex = nextAmbiguousMatch
      initialActions = withInitialActions
      return
    }

    dispatch("done", session.results)
  }

  function handleActions(e: CustomEvent<DisambiguationAction[]>) {
    updateSession(applyDisambiguationActions(session, currentMatchIndex, e.detail))
    goToNextAmbiguousMatch()
  }

  function undoActions() {
    if (session.undoStack.length === 0) return

    const [ newSession, actions ] = undoDisambiguationActions(session)
    updateSession(newSession)

    goToNextAmbiguousMatch(actions ?? undefined)
  }

  function updateSession(newSession: DisambiguationSession) {
    session = newSession
    savedDisambiguationSession.set(session)
  }

  $: currentMatch = session.results.matches[currentMatchIndex] as MatchedBusStop<AmbiguousBusStopMatch>
  $: remainingAmbiguousMatches = session.results.matches.filter(({ match }) => match?.ambiguous).length

  onMount(goToNextAmbiguousMatch)
</script>

<style>
  .progress {
    text-align: center;
  }
</style>

{#if currentMatchIndex !== -1}
  <StopDisambiguator
    {initialActions}
    canUndo={session.undoStack.length > 0}
    matchedStop={currentMatch}
    on:submit={handleActions}
    on:undo={undoActions}
  >
    <div class="progress" slot="controls">
      {remainingAmbiguousMatches} ambiguous matches remaining
      &bull;
      Your progress is automatically saved
    </div>
  </StopDisambiguator>
{/if}