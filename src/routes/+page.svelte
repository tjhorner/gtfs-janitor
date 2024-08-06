<script lang="ts">
  import GtfsUpload from "$lib/components/GtfsUpload.svelte"
  import Modal from "$lib/components/Modal.svelte"
  import MultipleStopsDisambiguator from "$lib/components/MultipleStopsDisambiguator.svelte"
  import OsmChangeGenerator from "$lib/components/OsmChangeGenerator.svelte"
  import ProfileChooser from "$lib/components/ProfileChooser.svelte"
  import StopMatcher from "$lib/components/StopMatcher.svelte"
  import type { DisambiguationResults } from "$lib/pipeline/disambiguator/session"
  import type { MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { savedDisambiguationSession } from "$lib/stores/disambiguation-session"
  import { importProfile } from "$lib/stores/import-profile"
  import type { Draft } from "immer"

  let matchedStops: MatchedBusStop[] = [ ]
  let step: "upload" | "match" | "disambiguate" | "export" = "upload"
  let disambiguationResults: Draft<DisambiguationResults> | undefined

  function handleGtfsData() {
    step = "match"
  }

  function handleMatchedStops(event: CustomEvent<MatchedBusStop[]>) {
    matchedStops = event.detail
    step = "disambiguate"
  }

  function onDisambiguationComplete(event: CustomEvent<DisambiguationResults>) {
    disambiguationResults = event.detail as Draft<DisambiguationResults>
    step = "export"
  }

  function restoreSession() {
    if ($savedDisambiguationSession) {
      step = "disambiguate"
    }
  }

  function discardSession() {
    savedDisambiguationSession.set(null)
  }
</script>

<Modal
  shown={step === "upload" && !!$savedDisambiguationSession}
  on:hide={discardSession}
>
  <h2>Saved Session</h2>

  <p>
    We found a saved session. Would you like to continue working on it?
  </p>

  <div>
    <button on:click={restoreSession}>Restore</button>
    <button on:click={discardSession}>Discard</button>
  </div>
</Modal>

{#if !$importProfile}
  <ProfileChooser />
{:else if step === "upload"}
  <GtfsUpload on:done={handleGtfsData} />
{:else if step === "match"}
  <StopMatcher on:matches={handleMatchedStops} />
{:else if step === "disambiguate"}
  <MultipleStopsDisambiguator
    {matchedStops}
    on:done={onDisambiguationComplete}
  />
{:else if step === "export" && disambiguationResults}
  <OsmChangeGenerator results={disambiguationResults} />
{/if}
