<script lang="ts">
  import { OsmChangeFile } from "$lib/osm/osmchange"
  import type { DisambiguationResults } from "$lib/pipeline/disambiguator/session"
  import { importProfile } from "$lib/stores/import-profile"
  import { stopCandidates } from "$lib/stores/stop-candidates"
  import { jsonataFilter } from "$lib/util/jsonata-filter"
  import type { Draft } from "immer"
  import Center from "./Center.svelte"
  import GenerateOsmChangeWorker from "$lib/workers/generate-osmchange?worker"
  import type { GenerateOsmChangeRequest, GenerateOsmChangeResponse } from "$lib/workers/generate-osmchange"
  import { onMount } from "svelte"

  export let results: Draft<DisambiguationResults>

  let options = {
    createNewStops: true,
    updateExistingStops: true,
    removeStagedForDeletion: true,
    removeOldStops: false
  }

  let loading = false
  let osmChangeFile: OsmChangeFile | undefined
  let osmChangeWorker = new GenerateOsmChangeWorker()

  const generateOsmChangeFile = (opts: typeof options) => {
    return new Promise<OsmChangeFile>(async (resolve, reject) => {
      const responseHandler = (e: MessageEvent<GenerateOsmChangeResponse>) => {
        resolve(OsmChangeFile.from(e.data.osmChange))
        osmChangeWorker.removeEventListener("message", responseHandler)
      }

      osmChangeWorker.addEventListener("message", responseHandler)

      const errorHandler = (e: ErrorEvent) => {
        reject(e.error)
        osmChangeWorker.removeEventListener("error", errorHandler)
      }

      osmChangeWorker.addEventListener("error", errorHandler)

      osmChangeWorker.postMessage({
        disambiguationResults: results,
        disusedStopCandidates: await disusedStopCandidates,
        opts
      } as GenerateOsmChangeRequest)
    })
  }

  async function regenerateWithOptions() {
    loading = true
    osmChangeFile = await generateOsmChangeFile(options)
    loading = false
  }

  async function getDisusedStopCandidates() {
    if (!$stopCandidates) return [ ]
    if (!$importProfile?.disusedStopFilter) return $stopCandidates

    const filter = jsonataFilter($importProfile.disusedStopFilter)
    return await filter($stopCandidates)
  }

  async function exportFile() {
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

  onMount(() => {
    return () => {
      osmChangeWorker.terminate()
    }
  })
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

  @media (prefers-color-scheme: dark) {
    .changeset-suggestion {
      background-color: #333;
      color: white;
    }
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
      <input type="checkbox" disabled={loading} bind:checked={options.createNewStops}>
      Create new stops
    </label>
    <label>
      <input type="checkbox" disabled={loading} bind:checked={options.updateExistingStops}>
      Update existing stops
    </label>
    <label>
      <input type="checkbox" disabled={loading} bind:checked={options.removeStagedForDeletion}>
      Remove nodes manually staged for deletion
    </label>
    <label>
      <input type="checkbox" disabled={loading || !$stopCandidates} bind:checked={options.removeOldStops}>
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