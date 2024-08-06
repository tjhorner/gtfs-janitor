<script lang="ts">
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/session"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import maplibregl from "maplibre-gl"
  import { onMount } from "svelte"
  import { Control, ControlButton, ControlGroup, MapLibre, Marker, RasterLayer, RasterTileSource, type LngLatLike } from "svelte-maplibre"
  import Legend from "./Legend.svelte"
  import NodeMarker from "./NodeMarker.svelte"

  export let matchedStop: MatchedBusStop<AmbiguousBusStopMatch>
  export let selectedActions: DisambiguationAction[]
  export let cycleAction: (index: number) => void

  let map: maplibregl.Map
  let satelliteImagery = true

  function fitBounds() {
    if (!map || !bounds) return
    map.fitBounds(bounds, { padding: 200, duration: 0, maxZoom: 19 })
  }

  function handleKeyboardShortcuts(event: KeyboardEvent) {
    if (event.key === "i") {
      satelliteImagery = !satelliteImagery
    }
  }

  $: gtfsStopLocation = [ matchedStop.stop.lon, matchedStop.stop.lat ] as LngLatLike

  $: bounds = matchedStop.match.elements.length
    ? matchedStop.match.elements.reduce((b, el) => {
        return b.extend([ el.lon, el.lat ])
      }, new maplibregl.LngLatBounds().extend(gtfsStopLocation))
    : undefined

  $: bounds && map && fitBounds()

  onMount(() => {
    map.once("load", fitBounds)
  })
</script>

<style>
  :global(.disambiguator-map) {
    height: 100%;
  }
</style>

<svelte:window on:keydown={handleKeyboardShortcuts} />

<MapLibre
  bind:map={map}
  style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  class="disambiguator-map"
>
  <Control position="top-left">
    <ControlGroup>
      <ControlButton on:click={() => satelliteImagery = !satelliteImagery}>
        🌍
      </ControlButton>
    </ControlGroup>
  </Control>

  <Control position="top-right">
    <ControlGroup>
      <Legend match={matchedStop.match} />
    </ControlGroup>
  </Control>

  <Marker lngLat={gtfsStopLocation}>
    <NodeMarker type="gtfs" />
  </Marker>

  {#each matchedStop.match.elements as element, index}
    <Marker lngLat={[ element.lon, element.lat ]} on:click={() => cycleAction(index)}>
      <NodeMarker
        type="candidate"
        index={index}
        action={selectedActions[index]}
      />
    </Marker>
  {/each}

  {#if satelliteImagery}
    <RasterTileSource
      tiles={[
        "https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=14634&pr=odbl",
        "https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=14634&pr=odbl",
        "https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=14634&pr=odbl",
        "https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=14634&pr=odbl"
      ]}
      tileSize={256}
      maxzoom={20}
      attribution="Imagery © Microsoft"
    >
      <RasterLayer
        paint={{ "raster-opacity": 1 }}
        maxzoom={23}
        beforeId="boundary_country_outline"
      />
    </RasterTileSource>
  {/if}
</MapLibre>