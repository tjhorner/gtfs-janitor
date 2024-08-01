<script lang="ts">
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/actions"
  import type { AmbiguousBusStopMatch } from "$lib/pipeline/matcher/bus-stops"
  import SegmentedControl from "../SegmentedControl.svelte"
  import { getColor } from "./colors"

  export let match: AmbiguousBusStopMatch
  export let selectedActions: DisambiguationAction[]

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
</style>

<table>
  <tr>
    <th>Key</th>
    {#each match.elements as element, index}
      <th style={`background-color: ${getColor(index)}`}>
        Option {index + 1}:
        <a href={`https://www.openstreetmap.org/${element.type}/${element.id}`} target="_blank">{element.type} {element.id}</a>
      </th>
    {/each}
  </tr>
  {#each allTagKeys as key}
    <tr>
      <th class="key">{key}</th>
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