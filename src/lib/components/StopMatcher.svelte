<script lang="ts">
  import type { GTFSData } from "$lib/gtfs/types"
  import { isNode } from "$lib/osm/overpass"
  import { getStopElementsInBbox } from "$lib/osm/query"
  import { type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { importProfile } from "$lib/stores/import-profile"
  import { stopCandidates } from "$lib/stores/stop-candidates"
  import { expandBoundingBox, getStopsBoundingBox } from "$lib/util/geo-math"
  import { jsonataFilter } from "$lib/util/jsonata-filter"
  import type { MatchBusStopsRequest } from "$lib/workers/match-bus-stops"
  import BusStopMatchWorker from "$lib/workers/match-bus-stops?worker"
  import { createEventDispatcher, onMount } from "svelte"
  import Center from "./Center.svelte"

  export let gtfsData: GTFSData

  const dispatch = createEventDispatcher<{
    matches: MatchedBusStop[]
  }>()

  let step: "confirm" | "downloadOsmData" | "matchStops" = "confirm"
  let currentStop = 0

  let matches: MatchedBusStop[] = [ ]

  let worker: Worker | undefined

  function handleWorkerMessage(e: MessageEvent<MatchedBusStop>) {
    currentStop++
    matches.push(e.data)

    if (currentStop === gtfsData.stops.length) {
      worker?.terminate()
      worker = undefined

      dispatch("matches", matches)
    }
  }

  async function matchStops() {
    // Extend the bounding box by 5km in each direction
    // so that we catch stops that may have moved or are
    // out of service
    const bbox = expandBoundingBox(
      getStopsBoundingBox(gtfsData.stops),
      5000 // 5km
    )

    step = "downloadOsmData"
    const osmData = await getStopElementsInBbox(`${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`)

    step = "matchStops"

    const allNodes = osmData.filter(isNode)

    let candidateNodes = allNodes
    if ($importProfile?.candidateNodeFilter) {
      const filter = jsonataFilter($importProfile.candidateNodeFilter)
      candidateNodes = await filter(allNodes)
    }

    console.log(candidateNodes)

    $stopCandidates = candidateNodes

    const worker = new BusStopMatchWorker()
    worker.onmessage = handleWorkerMessage

    const request: MatchBusStopsRequest = {
      candidates: candidateNodes,
      stops: gtfsData.stops
    }

    worker.postMessage(request)
  }

  const pctFormat = new Intl.NumberFormat(undefined, { style: "percent" })
  $: percentComplete = pctFormat.format(currentStop / gtfsData.stops.length)

  onMount(() => {
    return () => {
      worker?.terminate()
    }
  })
</script>

<Center>
  {#if step === "confirm"}
    <p>
      Found {gtfsData.stops.length.toLocaleString()} bus stops from GTFS data. Continue?
    </p>

    <div>
      <button on:click={matchStops}>Start Import</button>
    </div>
  {:else if step === "downloadOsmData"}
    Querying Overpass for existing bus stops...
  {:else if step === "matchStops"}
    <p>Matching bus stops...</p>
    <p>{percentComplete} complete</p>
  {/if}
</Center>