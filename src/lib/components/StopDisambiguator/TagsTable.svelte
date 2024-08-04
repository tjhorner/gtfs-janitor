<script lang="ts">
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/session"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { calculateDistanceMeters } from "$lib/util/geo-math"
  import SegmentedControl from "../SegmentedControl.svelte"
  import { getColor } from "./colors"

  export let stopMatch: MatchedBusStop<AmbiguousBusStopMatch>
  export let selectedActions: DisambiguationAction[]

  function formatMeters(meters: number) {
    return meters.toLocaleString(undefined, {
      style: "unit",
      unit: "meter",
      unitDisplay: "narrow"
    })
  }

  $: match = stopMatch.match
  $: stop = stopMatch.stop
  $: allTagKeys = match.elements.reduce((acc, element) => {
    return acc.union(new Set(Object.keys(element.tags)))
  }, new Set<string>())
</script>

<style>
  table tr:first-of-type th, table tr:first-of-type td {
    border-bottom-width: 2px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
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

  .sticky-left {
    position: sticky;
    left: 0;
  }
</style>

<table>
  <tr>
    <th class="sticky-left">Key</th>
    {#each match.elements as element, index}
      <th style={`background-color: ${getColor(index)}; color: white`}>
        Option {index + 1}:
        <a href={`https://www.openstreetmap.org/${element.type}/${element.id}`} target="_blank">{element.type} {element.id}</a>
        <br>
        {formatMeters(calculateDistanceMeters(stop.stop_lat, stop.stop_lon, element.lat, element.lon))} away from stop
      </th>
    {/each}
  </tr>
  {#each allTagKeys as key}
    <tr>
      <th class="key sticky-left">{key}</th>
      {#each match.elements as element}
        <td>{element.tags[key] ?? ""}</td>
      {/each}
    </tr>
  {/each}
  <tr class="actions">
    <td></td>
    {#each match.elements as _, index}
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