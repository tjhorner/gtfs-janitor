<script lang="ts">
  import type { GTFSData } from "$lib/gtfs/parser"
  import type { MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import type { Draft } from "immer"
  import GtfsUpload from "$lib/components/GtfsUpload.svelte"
  import MultipleStopsDisambiguator from "$lib/components/MultipleStopsDisambiguator.svelte"
  import StopMatcher from "$lib/components/StopMatcher.svelte"
  import { OsmChangeFile } from "$lib/osm/osmchange"
  import { processStopMatches } from "$lib/pipeline/actions/process-stop-matches"
  import Center from "$lib/components/Center.svelte"
  import { applyDisambiguationResults, type DisambiguationResults, type DisambiguationSession } from "$lib/pipeline/disambiguator/session"
  import { onMount } from "svelte"
  import { clearDisambiguationSession, loadDisambiguationSession } from "$lib/pipeline/disambiguator/storage"
  import Modal from "$lib/components/Modal.svelte"

  let gtfsData: Readonly<GTFSData> | undefined
  let matchedStops: MatchedBusStop[] = [ ]
  let step: "upload" | "match" | "disambiguate" | "process" | "export" = "upload"
  let savedSession: DisambiguationSession | undefined

  let osmChange = new OsmChangeFile()

  function handleGtfsData(event: CustomEvent<GTFSData>) {
    gtfsData = Object.freeze(event.detail)
    step = "match"
  }

  function handleMatchedStops(event: CustomEvent<MatchedBusStop[]>) {
    matchedStops = event.detail
    step = "disambiguate"
  }

  function onDisambiguationComplete(event: CustomEvent<DisambiguationResults>) {
    const results = event.detail as Draft<DisambiguationResults>

    step = "process"
    applyDisambiguationResults(results, osmChange)
    processStopMatches(results.matches, osmChange)
    step = "export"
  }

  function downloadChangeFile() {
    const file = new Blob([osmChange.generate()], { type: "application/xml" })
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = "bus-stops.osc"
    a.click()
    URL.revokeObjectURL(url)
  }

  function restoreSession() {
    if (savedSession) {
      step = "disambiguate"
    }
  }

  function discardSession() {
    savedSession = undefined
    clearDisambiguationSession()
  }

  onMount(async () => {
    const maybeSavedSession = await loadDisambiguationSession()
    if (maybeSavedSession) {
      savedSession = maybeSavedSession
    }
  })
</script>

<Modal
  shown={step === "upload" && !!savedSession}
  on:hide={discardSession}
>
  <h2>Saved Session</h2>

  <p>
    A session you were previously working on has been saved. Would
    you like to restore it?
  </p>

  <div>
    <button on:click={restoreSession}>Restore</button>
    <button on:click={discardSession}>Discard</button>
  </div>
</Modal>

{#if step === "upload"}
  <GtfsUpload on:gtfsData={handleGtfsData} />
{:else if step === "match" && gtfsData}
  <StopMatcher {gtfsData} on:matches={handleMatchedStops} />
{:else if step === "disambiguate"}
  <MultipleStopsDisambiguator
    {matchedStops}
    initialSession={savedSession}
    on:done={onDisambiguationComplete}
  />
{:else if step === "process"}
  Processing matched bus stops...
{:else if step === "export"}
  <Center>
    <h1>Import Summary</h1>

    <p>
      Successfully processed all bus stops and merged them with
      existing OpenStreetMap data. Here is a summary of the changes that will be made:
    </p>

    <ul>
      <li>{osmChange.additions.length} nodes will be added</li>
      <li>{osmChange.modifications.length} nodes will be modified</li>
      <li>{osmChange.deletions.length} nodes will be removed</li>
    </ul>

    <p>
      You can download the resulting osmChange file to open in another editor for further review.
    </p>

    <button on:click={downloadChangeFile}>Download</button>
  </Center>
{/if}
