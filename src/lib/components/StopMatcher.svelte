<script lang="ts">
  import { isNode } from "$lib/osm/overpass"
  import { getStopElementsInBbox } from "$lib/osm/query"
  import { type MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { importProfile } from "$lib/stores/import-profile"
  import { stopCandidates } from "$lib/stores/stop-candidates"
  import { expandBoundingBox, getStopsBoundingBox } from "$lib/util/geo-math"
  import { jsonataFilter } from "$lib/util/jsonata-filter"
  import type { MatchBusStopsRequest, MatchBusStopsResponse } from "$lib/workers/match-bus-stops"
  import BusStopMatchWorker from "$lib/workers/match-bus-stops?worker"
  import { createEventDispatcher, onMount } from "svelte"
  import Center from "./Center.svelte"
  import { gtfsRepository } from "$lib/stores/gtfs-repository"
  import { liveQuery, type Observable } from "dexie"

  const dispatch = createEventDispatcher<{
    matches: MatchedBusStop[]
  }>()

  let step: "confirm" | "downloadOsmData" | "matchStops" = "confirm"
  let currentStop = 0
  let totalStops: Observable<number | undefined> = liveQuery(() => $gtfsRepository.stops.count())

  let matches: MatchedBusStop[] = [ ]

  let worker: Worker | undefined

  function handleWorkerMessage(e: MessageEvent<MatchBusStopsResponse>) {
    const resp = e.data
    if (resp.type === "match") {
      currentStop++
      matches.push(resp.match)
    } else if (resp.type === "complete") {
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
      await $gtfsRepository.getStopsBoundingBox(),
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

    $stopCandidates = candidateNodes

    const worker = new BusStopMatchWorker()
    worker.onmessage = handleWorkerMessage

    const request: MatchBusStopsRequest = {
      candidates: candidateNodes
    }

    worker.postMessage(request)
  }

  const pctFormat = new Intl.NumberFormat(undefined, { style: "percent" })
  $: percentComplete = pctFormat.format(currentStop / ($totalStops ?? 1))

  onMount(() => {
    return () => {
      worker?.terminate()
    }
  })
</script>

<Center>
  <h1>Match Stops</h1>

  {#if step === "confirm"}
    <p>
      Imported {$totalStops?.toLocaleString() ?? 0} transit stops from GTFS data.
    </p>

    <p>
      Next, GTFS Janitor will search OpenStreetMap for existing transit stops and
      attempt to automatically match them to stops in the GTFS data. After that,
      you will be able to review any ambiguous matches.
    </p>

    <div>
      <button on:click={matchStops}>Start Matching</button>
    </div>
  {:else if step === "downloadOsmData"}
    Querying Overpass for existing transit stops...
  {:else if step === "matchStops"}
    <p>Matching transit stops...</p>
    <p>{percentComplete} complete</p>
  {/if}
</Center>