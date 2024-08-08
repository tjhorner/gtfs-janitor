<script lang="ts">
  import { tagsForOsmBusStop } from "$lib/pipeline/actions/process-stop-matches"
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/session"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { gtfsRepository } from "$lib/stores/gtfs-repository"
  import { calculateDistanceMeters } from "$lib/util/geo-math"
  import { fade, slide } from "svelte/transition"
  import SegmentedControl from "../SegmentedControl.svelte"
  import { getColor } from "./colors"

  export let matchedStop: MatchedBusStop<AmbiguousBusStopMatch>
  export let setAction: (index: number, action: DisambiguationAction) => void
  export let selectedActions: readonly DisambiguationAction[]

  let expectedTags: Promise<Record<string, string>> | undefined

  function formatMeters(meters: number) {
    return meters.toLocaleString(undefined, {
      style: "unit",
      unit: "meter",
      unitDisplay: "narrow"
    })
  }

  function onActionUpdate(index: number, e: any) {
    setAction(index, e.currentTarget.value)
  }

  async function getExpectedTags(stopId: string) {
    const routesServingStop = await $gtfsRepository.getRoutesServingStop(stopId)
    return tagsForOsmBusStop(matchedStop.stop, routesServingStop)
  }

  $: match = matchedStop.match
  $: stop = matchedStop.stop

  $: expectedTags = getExpectedTags(matchedStop.stop.id)
  $: allTagKeys = expectedTags?.then(expected => (
    match.elements.reduce((acc, element) => {
      return acc.union(new Set(Object.keys(element.tags)))
    }, new Set<string>(Object.keys(expected)))
  )) ?? Promise.resolve(new Set<string>([ ]))
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

  @media (prefers-color-scheme: dark) {
    th {
      background-color: #333;
      color: white;
    }

    tr:not(.actions):hover {
      background-color: #444;
    }

    th, td {
      border-color: #555;
    }
  }

  .sticky-left {
    position: sticky;
    left: 0;
  }
</style>

{#await allTagKeys then tagKeys}

<table transition:fade={{ duration: 50 }}>
  <tr>
    <th class="sticky-left">Key</th>
    <th>Expected Value</th>
    {#each match.elements as element, index}
      <th style={`background-color: ${getColor(index)}; color: white`}>
        Option {index + 1}:
        <a href={`https://www.openstreetmap.org/${element.type}/${element.id}`} target="_blank">{element.type} {element.id}</a>
        <br>
        {formatMeters(calculateDistanceMeters(stop.lat, stop.lon, element.lat, element.lon))} away from stop
      </th>
    {/each}
  </tr>
  {#each tagKeys as key}
    <tr>
      <th class="key sticky-left">{key}</th>
      {#await expectedTags then expectedValues}
        <td>{expectedValues[key] ?? ""}</td>
      {/await}
      {#each match.elements as element}
        <td>{element.tags[key] ?? ""}</td>
      {/each}
    </tr>
  {/each}
  <tr class="actions">
    <td colspan="2"></td>
    {#each match.elements as _, index}
      <td>
        <SegmentedControl
          value={selectedActions[index]}
          on:change={(e) => onActionUpdate(index, e)}
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

{/await}