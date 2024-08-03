<script lang="ts">
  import type { GTFSData } from "$lib/gtfs/parser"
  import { isNode } from "$lib/osm/overpass"
  import { getBusElementsInBbox } from "$lib/osm/query"
  import { type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { getStopsBoundingBox } from "$lib/util/geo-math"
  import type { MatchBusStopsRequest } from "$lib/workers/match-bus-stops"
  import { createEventDispatcher, onMount } from "svelte"
  import BusStopMatchWorker from "$lib/workers/match-bus-stops?worker"
  import Center from "./Center.svelte"
  import { stopCandidates } from "$lib/stores/stop-candidates"
  import { importConfig } from "$lib/stores/import-config"
  import jsonata from "jsonata"

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
    const bbox = getStopsBoundingBox(gtfsData.stops)

    step = "downloadOsmData"
    const osmData = await getBusElementsInBbox(bbox)

    step = "matchStops"
    const configFilter = jsonata(`$filter($,function($v,$i,$a){${$importConfig?.candidateNodeFilter}})`)
    const candidateNodes = await configFilter.evaluate(osmData.filter(isNode))

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