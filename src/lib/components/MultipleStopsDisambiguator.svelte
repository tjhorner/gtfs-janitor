<script lang="ts">
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/actions"
  import { createEventDispatcher, onMount } from "svelte"
  import StopDisambiguator from "./StopDisambiguator/StopDisambiguator.svelte"
  import { getOsmChangeContext } from "$lib/context/osmchange"

  export let matches: MatchedBusStop[]

  const dispatch = createEventDispatcher<{ done: void }>()

  const osmChange = getOsmChangeContext()

  let currentMatchIndex = -1

  function goToNextAmbiguousMatch() {
    const nextAmbiguousMatch = matches.findIndex(({ match }) => match?.ambiguous)
    if (nextAmbiguousMatch !== -1) {
      currentMatchIndex = nextAmbiguousMatch
      return
    }

    dispatch("done")
  }

  function handleActions(event: CustomEvent<DisambiguationAction[]>) {
    const actions = event.detail
    const matchCandidates = currentMatch.match.elements

    const matchedCandidateIndex = actions.findIndex(action => action === "match")
    if (matchedCandidateIndex !== -1) {
      const matchedCandidate = matchCandidates[matchedCandidateIndex]
      matches[currentMatchIndex].match = {
        ambiguous: false,
        matchedBy: "human",
        element: matchedCandidate
      }
    } else {
      matches[currentMatchIndex].match = null
    }

    actions.forEach((action, index) => {
      if (action === "delete") {
        osmChange.deleteElement(matchCandidates[index])
      }
    })

    goToNextAmbiguousMatch()
  }

  $: currentMatch = matches[currentMatchIndex] as MatchedBusStop<AmbiguousBusStopMatch>
  $: remainingAmbiguousMatches = matches.filter(({ match }) => match?.ambiguous).length

  onMount(goToNextAmbiguousMatch)
</script>

<style>
  .progress {
    text-align: center;
  }
</style>

{#if currentMatchIndex !== -1}
  <StopDisambiguator matchedStop={currentMatch} on:submit={handleActions}>
    <div class="progress" slot="controls">
      {remainingAmbiguousMatches} ambiguous matches remaining
    </div>
  </StopDisambiguator>
{/if}