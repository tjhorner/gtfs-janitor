<script lang="ts">
  import type { GTFSData } from "$lib/gtfs/parser"
  import { isNode } from "$lib/osm/overpass"
  import { getBusElementsInBbox } from "$lib/osm/query"
  import { isKingCountyBusStop } from "$lib/pipeline/filter/is-king-county-bus-stop"
  import { isNotRoadWayMember } from "$lib/pipeline/filter/is-not-road-way-member"
  import { type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { cached } from "$lib/util/cache"
  import { getStopsBoundingBox } from "$lib/util/geo-math"
  import type { MatchBusStopsRequest } from "$lib/workers/match-bus-stops"
  import { createEventDispatcher, onMount } from "svelte"
  import BusStopMatchWorker from "$lib/workers/match-bus-stops?worker"
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
    const bbox = getStopsBoundingBox(gtfsData.stops)

    step = "downloadOsmData"
    const osmData = await getBusElementsInBbox(bbox)

    step = "matchStops"
    const candidateNodes = osmData
      .filter(isNode)
      .filter(isKingCountyBusStop)
      .filter(isNotRoadWayMember(osmData))

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
      Found {new Intl.NumberFormat(undefined).format(gtfsData.stops.length)} bus stops from GTFS data. Continue?
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