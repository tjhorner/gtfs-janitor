<script lang="ts">
  import type { GTFSData } from "$lib/gtfs/parser"
  import type { MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import GtfsUpload from "$lib/components/GtfsUpload.svelte"
  import MultipleStopsDisambiguator from "$lib/components/MultipleStopsDisambiguator.svelte"
  import StopMatcher from "$lib/components/StopMatcher.svelte"
  import { OsmChangeFile } from "$lib/osm/osmchange"
  import { processStopMatches } from "$lib/pipeline/actions/process-stop-matches"
  import Center from "$lib/components/Center.svelte"
  import { setOsmChangeContext } from "$lib/context/osmchange"

  let gtfsData: Readonly<GTFSData> | undefined
  let matchedStops: MatchedBusStop[] = [ ]
  let step: "upload" | "match" | "disambiguate" | "process" | "export" = "upload"

  let osmChange = new OsmChangeFile()
  setOsmChangeContext(osmChange)

  function handleGtfsData(event: CustomEvent<GTFSData>) {
    gtfsData = Object.freeze(event.detail)
    step = "match"
  }

  function handleMatchedStops(event: CustomEvent<MatchedBusStop[]>) {
    matchedStops = event.detail
    step = "disambiguate"
  }

  function onDisambiguationComplete() {
    step = "process"
    processStopMatches(matchedStops, osmChange)
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
</script>

{#if step === "upload"}
  <GtfsUpload on:gtfsData={handleGtfsData} />
{:else if step === "match" && gtfsData}
  <StopMatcher {gtfsData} on:matches={handleMatchedStops} />
{:else if step === "disambiguate"}
  <MultipleStopsDisambiguator matches={matchedStops} on:done={onDisambiguationComplete} />
{:else if step === "process"}
  Processing matched bus stops...
{:else if step === "export"}
  <Center>
    <h1>Import Summary</h1>

    <p>
      Successfully processed {matchedStops.length} bus stops and merged them with
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
