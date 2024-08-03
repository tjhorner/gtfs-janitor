<script lang="ts">
  import type { Draft } from "immer"
  import { OsmChangeFile } from "$lib/osm/osmchange"
  import { processStopMatches } from "$lib/pipeline/actions/process-stop-matches"
  import type { DisambiguationResults } from "$lib/pipeline/disambiguator/session"
  import Center from "./Center.svelte"
  import { removeOldStops } from "$lib/pipeline/actions/remove-old-stops"
  import { stopCandidates } from "$lib/stores/stop-candidates"
  import { applyDisambiguationResults } from "$lib/pipeline/actions/apply-disambiguation-results"
  import { importConfig } from "$lib/stores/import-config"
  import jsonata from "jsonata"

  export let results: Draft<DisambiguationResults>

  let options = {
    createNewStops: true,
    updateExistingStops: true,
    removeStagedForDeletion: true,
    removeOldStops: false
  }

  let osmChangeFile: OsmChangeFile | undefined

  async function regenerateWithOptions() {
    const file = new OsmChangeFile()

    if (options.removeStagedForDeletion) {
      applyDisambiguationResults(results, file)
    }

    processStopMatches(results.matches, file, {
      createNodes: options.createNewStops,
      updateNodes: options.updateExistingStops,
      additionalTags: $importConfig?.stopTags ?? { }
    })

    if (options.removeOldStops) {
      const candidates = await disusedStopCandidates
      removeOldStops(results.matches, candidates, file)
    }

    osmChangeFile = file
  }

  async function getDisusedStopCandidates() {
    if (!$importConfig?.disusedStopFilter) return $stopCandidates
    const filter = jsonata(`$filter($,function($v,$i,$a){${$importConfig.disusedStopFilter}})`)
    return await filter.evaluate($stopCandidates)
  }

  function exportFile() {
    if (!osmChangeFile) return
    const file = new Blob([osmChangeFile.generate()], { type: "application/xml" })
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = "gtfs-janitor-export.osc"
    a.click()
    URL.revokeObjectURL(url)
  }

  $: options && regenerateWithOptions()
  $: disusedStopCandidates = getDisusedStopCandidates()
</script>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .changeset-suggestion {
    font-family: monospace;
    background-color: #f0f0f0;
    padding: 0.5em;
    border-radius: 0.25em;
  }
</style>

<Center>
  <h1>Generate osmChange File</h1>

  <p>
    All stops have been processed and your osmChange file is ready to be generated.
    Please select which types of changes you would like to export.
  </p>

  <div class="form">
    <label>
      <input type="checkbox" bind:checked={options.createNewStops}>
      Create new stops
    </label>
    <label>
      <input type="checkbox" bind:checked={options.updateExistingStops}>
      Update existing stops
    </label>
    <label>
      <input type="checkbox" bind:checked={options.removeStagedForDeletion}>
      Remove nodes manually staged for deletion
    </label>
    <label>
      <input type="checkbox" bind:checked={options.removeOldStops} disabled={!$stopCandidates}>
      Add <code>disused:*</code> prefix to out-of-service stops
    </label>
  </div>

  {#if osmChangeFile}
    <h2>Export Summary</h2>

    <ul>
      <li>
        <strong>{osmChangeFile.additions.length.toLocaleString()}</strong> nodes will be added
      </li>
      <li>
        <strong>{osmChangeFile.modifications.length.toLocaleString()}</strong> nodes will be modified
      </li>
      <li>
        <strong>{osmChangeFile.deletions.length.toLocaleString()}</strong> nodes will be removed
      </li>
    </ul>

    <p>
      We suggest including the hashtag <code>#gtfs-janitor</code>
      in your changeset summary so that it's clear to other mappers how these
      changes were made. For example:
    </p>

    <p class="changeset-suggestion">
      Sync bus stops with GTFS feed #gtfs-janitor
    </p>

    <p>
      Please carefully review the changes in an external editor before uploading
      them to OpenStreetMap.
    </p>

    <button on:click={exportFile}>
      Export osmChange
    </button>
  {/if}
</Center>