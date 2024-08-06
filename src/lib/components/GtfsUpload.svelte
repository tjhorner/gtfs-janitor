<script lang="ts">
  import { importProfile } from "$lib/stores/import-profile"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"
  import GTFSImportWorker from "$lib/workers/import-gtfs-data?worker"
  import { gtfsRepository } from "$lib/stores/gtfs-repository"
  import { liveQuery } from "dexie"

  const dispatch = createEventDispatcher<{
    done: void
  }>()

  let loading = false
  let stopCount = liveQuery(() => $gtfsRepository.stops.count())

  async function processUpload({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    loading = true

    const worker = new GTFSImportWorker()
    worker.onmessage = () => {
      worker.terminate()
      dispatch("done")
      loading = false
    }

    worker.postMessage({ gtfsBlob: currentTarget.files![0] })
  }

  function changeProfile() {
    $importProfile = null
  }

  function continueWithExistingStops() {
    dispatch("done")
  }

  let clearingDb = false
  async function clearDatabase() {
    clearingDb = true
    await $gtfsRepository.clearAll()
    clearingDb = false
  }
</script>

<Center>
  <h1>Upload GTFS Feed</h1>

  {#if loading}
    <p>
      Processing GTFS data... (this can take a while)
    </p>
  {:else}
    {#if $stopCount > 0}
      <p>
        You previously imported {$stopCount.toLocaleString()} into GTFS Janitor.
        Would you like to use those or upload a new GTFS feed?
      </p>

      <button on:click={continueWithExistingStops} disabled={clearingDb}>Continue</button>
      <button on:click={clearDatabase} disabled={clearingDb}>
        {#if clearingDb}
          Clearing database...
        {:else}
          Upload New Feed
        {/if}
      </button>
    {:else}
      <p>
        Upload a GTFS .zip file to merge bus stop data with OpenStreetMap.
      </p>

      <input
        type="file"
        accept=".zip"
        multiple={false}
        on:change={processUpload} />
    {/if}

    <h2>Current Profile</h2>

    <p>
      You are currently using the import profile "<strong>{$importProfile?.name}</strong>".
    </p>

    <button on:click={changeProfile}>Change Profile</button>
  {/if}
</Center>