<script lang="ts">
  import { Control, ControlButton, ControlGroup, MapLibre, Marker, RasterLayer, RasterTileSource, type LngLatLike } from "svelte-maplibre"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { createEventDispatcher, onMount } from "svelte"
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/actions"
  import { recommendDisambiguationActions, type DisambiguationRecommendations } from "$lib/pipeline/disambiguator/recommended-actions"
  import SegmentedControl from "./SegmentedControl.svelte"
  import maplibregl from "maplibre-gl"
  import Modal from "./Modal.svelte"
  import LinkButton from "./LinkButton.svelte"

  export let match: MatchedBusStop<AmbiguousBusStopMatch>

  let recommendations: DisambiguationRecommendations | null = null
  let selectedActions: DisambiguationAction[] = [ ]

  let map: maplibregl.Map
  let satelliteImagery = true

  let showKeyboardShortcuts = false

  const dispatch = createEventDispatcher<{
    submit: DisambiguationAction[]
  }>()

  const colors = [
    "#FF8A4C", // Orange
    "#B388FF", // Purple
    "#8BEF9B", // Green
    "#FFD966", // Yellow
    "#FFA7C4", // Pink
    "#80DEEA", // Blue
    "#E0E0E0", // Gray
  ]

  function getRecommendations() {
    recommendations = recommendDisambiguationActions(match)
    selectedActions = recommendations?.actions ?? match.match.elements.map(() => "ignore")
  }

  function submitActions() {
    if (selectedActions.filter(action => action === "match").length > 1) {
      alert("Please select exactly one match for this stop.")
      return
    }

    dispatch("submit", selectedActions)
  }

  function cycleAction(index: number) {
    if (index + 1 > match.match.elements.length) return

    const currentAction = selectedActions[index]
    const nextAction = currentAction === "ignore"
      ? "match"
      : currentAction === "match"
        ? "delete"
        : "ignore"

    selectedActions[index] = nextAction
  }

  function fitBounds() {
    if (!map || !bounds) return
    map.fitBounds(bounds, { padding: 200, duration: 0, maxZoom: 19 })
  }

  function handleKeyboardShortcuts(e: KeyboardEvent) {
    if (e.key === "a") {
      satelliteImagery = !satelliteImagery
    } else if (e.key >= "1" && e.key <= "9") {
      const index = parseInt(e.key) - 1
      cycleAction(index)
    } else if (e.key === "Enter" || e.key === "s") {
      submitActions()
    }
  }

  $: match && getRecommendations()
  $: gtfsStopLocation = [ match.stop.stop_lon, match.stop.stop_lat ] as LngLatLike

  $: bounds = match.match.elements.length
    ? match.match.elements.reduce((b, el) => {
        return b.extend([ el.lon, el.lat ])
      }, new maplibregl.LngLatBounds().extend(gtfsStopLocation))
    : undefined

  $: allTagKeys = match.match.elements.reduce((acc, element) => {
    return acc.union(new Set(Object.keys(element.tags)))
  }, new Set<string>())

  $: bounds && map && fitBounds()

  onMount(() => {
    map.once("load", fitBounds)
  })
</script>

<div class="split">
  <div class="info">
    <div>
      <h2>{match.stop.stop_name} &mdash; <code>{match.stop.stop_id}</code></h2>

      <p>
        There were multiple possible matches in OpenStreetMap for this stop. Please specify what to do
        with each of the possible matches.
      </p>

      <ul>
        <li><strong>Ignore</strong>: Leave this node as-is.</li>
        <li><strong>Match</strong>: Associate this node with the bus stop and use it for edits.</li>
        <li><strong>Delete</strong>: Delete this node in the exported changeset.</li>
      </ul>

      <p>
        If no match is selected, a new node will be created to represent this bus stop in OpenStreetMap.
      </p>

      <p>
        <strong>Tip</strong>: You can use <LinkButton on:click={() => showKeyboardShortcuts = true}>keyboard shortcuts</LinkButton> to speed up your workflow.
      </p>
    </div>

    <div class="tags">
      <table>
        <tr>
          <th>Key</th>
          {#each match.match.elements as element, index}
            <th style={`background-color: ${colors[index]}`}>
              Option {index + 1}:
              <a href={`https://www.openstreetmap.org/${element.type}/${element.id}`} target="_blank">{element.type} {element.id}</a>
            </th>
          {/each}
        </tr>
        {#each allTagKeys as key}
          <tr>
            <th class="key">{key}</th>
            {#each match.match.elements as element}
              <td>{element.tags[key] ?? ""}</td>
            {/each}
          </tr>
        {/each}
        <tr class="actions">
          <td></td>
          {#each match.match.elements as _, index}
            <td>
              <SegmentedControl
                bind:value={selectedActions[index]}
                options={[
                  { label: "Ignore", value: "ignore" },
                  { label: "Match", value: "match" },
                  { label: "Delete", value: "delete" }
                ]}
              />
            </td>
          {/each}
        </tr>
      </table>
    </div>

    <div class="controls">
      {#if recommendations}
        <p>
          <span style="font-size: 1.2em">
            <strong>Recommendation</strong>: {recommendations.summary}
          </span>
          <br/>
          {recommendations.reason}
        </p>
      {/if}

      <button class="submit" on:click={submitActions}>
        Next
      </button>

      <slot name="controls" />
    </div>
  </div>

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

    <Marker lngLat={gtfsStopLocation}>
      <div class="marker-circle gtfs">S</div>
    </Marker>

    {#each match.match.elements as element, index}
      <Marker lngLat={[ element.lon, element.lat ]} on:click={() => cycleAction(index)}>
        <div
          class="marker-circle candidate"
          class:matched={selectedActions[index] === "match"}
          class:deleted={selectedActions[index] === "delete"}
          style={`background-color: ${colors[index]}`}
        >
          {index + 1}
        </div>
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
</div>

<Modal bind:shown={showKeyboardShortcuts}>
  <h2>Tips</h2>

  <p>
    You can use the following keyboard shortcuts to speed up your workflow:
  </p>

  <ul style="padding-left: 1.5em">
    <li>
      <strong><kbd>A</kbd></strong>: Toggle aerial imagery
    </li>
    <li>
      <strong><kbd>1-9</kbd></strong>: Cycle through the actions for the corresponding option
    </li>
    <li>
      <strong><kbd>Enter</kbd> or <kbd>S</kbd></strong>: Submit the selected actions and go to next stop
    </li>
  </ul>

  <p>
    You can also click the nodes on the map to cycle through the actions.
  </p>
</Modal>

<svelte:window on:keydown={handleKeyboardShortcuts} on:beforeunload|preventDefault />

<style>
  :global(.disambiguator-map) {
    height: 100%;
  }

  .marker-circle {
    height: 25px;
    width: 25px;
    font-size: 1.5em;
    font-weight: bold;
    border-radius: 100%;
    color: white;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: box-shadow 0.1s ease;
  }

  .marker-circle.candidate {
    cursor: pointer;
  }

  .marker-circle.matched {
    box-shadow: 0 0 5px 8px lime;
  }

  .marker-circle.deleted {
    box-shadow: 0 0 5px 8px red;
  }

  .marker-circle.gtfs {
    background-color: black;
    color: white;
  }

  .tags {
    display: block;
    overflow-x: scroll;
    flex-shrink: 0;
    font-family: monospace;
  }

  .tags tr:first-of-type th, .tags tr:first-of-type td {
    border-bottom-width: 2px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    white-space: nowrap;
  }

  tr:not(.actions):hover {
    background-color: #f1f1f1;
  }

  tr.actions td {
    border-top-width: 2px;
  }

  tr.actions td:first-of-type {
    visibility: hidden;
    border: none;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .split {
    display: flex;
    height: 100%;
  }

  .split > :global(*) {
    flex: 1;
  }

  .info {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow: scroll;
  }

  .info h2 {
    margin-top: 0;
  }

  .info .controls {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-grow: 1;
    gap: 0.75em;
    margin-top: 0.75em;
  }

  .info .controls p {
    margin: 0;
  }

  .info .controls button.submit {
    font-size: 1.5em;
    padding: 0.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>