<script lang="ts">
  import { Control, ControlButton, ControlGroup, MapLibre, Marker, RasterLayer, RasterTileSource, type LngLatLike } from "svelte-maplibre"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { createEventDispatcher, onMount } from "svelte"
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/actions"
  import { recommendDisambiguationActions, type DisambiguationRecommendations } from "$lib/pipeline/disambiguator/recommended-actions"
  import SegmentedControl from "./SegmentedControl.svelte"

  export let match: MatchedBusStop<AmbiguousBusStopMatch>

  let recommendations: DisambiguationRecommendations | null = null
  let selectedActions: DisambiguationAction[] = [ ]

  let satelliteImagery = true

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

  $: match && getRecommendations()
  $: gtfsStopLocation = [ match.stop.stop_lon, match.stop.stop_lat ] as LngLatLike
  $: allTagKeys = match.match.elements.reduce((acc, element) => {
    return acc.union(new Set(Object.keys(element.tags)))
  }, new Set<string>())
</script>

<style>
  :global(.disambiguator-map) {
    height: 100%;
  }

  .marker-circle {
    height: 20px;
    width: 20px;
    text-align: center;
    border-radius: 100%;
    color: white;
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

<div class="split">
  <div class="info">
    <div>
      <h2>Which stop is this?</h2>

      <p>
        There were multiple possible matches in OpenStreetMap for the stop <strong>{match.stop.stop_name}</strong>.
        Please specify what to do with each of the possible matches.
      </p>

      <ul>
        <li><strong>Ignore</strong>: Leave this node as-is.</li>
        <li><strong>Match</strong>: Associate this node with the bus stop and use it for edits.</li>
        <li><strong>Delete</strong>: Delete this node in the exported changeset.</li>
      </ul>

      <p>
        If no match is selected, a new node will be created to represent this bus stop in OpenStreetMap.
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
          <strong>Recommendation:</strong> {recommendations.reason}
        </p>
      {/if}

      <button class="submit" on:click={submitActions}>
        Next
      </button>

      <slot name="controls" />
    </div>
  </div>

  <MapLibre
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    class="disambiguator-map"
    zoom={19}
    center={gtfsStopLocation}
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
      <Marker lngLat={[ element.lon, element.lat ]}>
        <div class="marker-circle candidate" style={`background-color: ${colors[index]}`}>
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