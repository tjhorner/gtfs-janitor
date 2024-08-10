<script lang="ts">
  import { importProfile } from "$lib/stores/import-profile"
  import { createEventDispatcher, onMount } from "svelte"
  import Center from "./Center.svelte"
  import { gtfsRepository } from "$lib/stores/gtfs-repository"
  import { liveQuery } from "dexie"
  import type { ImportGTFSDataRequest, ImportGTFSDataResponse } from "$lib/workers/import-gtfs-data"

  const dispatch = createEventDispatcher<{
    done: void
  }>()

  const rotatingMessages = [
    "Importing can take up to a minute.",
    "Seriously, there's a lot of data to import.",
    "I swear things are still happening. Just give it a minute.",
    "I'm not sure what's taking so long, but it's still working.",
    "If you're still here after like 5 minutes, maybe something has gone wrong. Maybe check the browser console."
  ]

  let rotatingMessageTimeout: any

  let loading = false
  let progressMessage = "Starting GTFS import..."
  let secondaryMessage = ""
  let stopCount = liveQuery(() => $gtfsRepository.stops.count())

  async function processUpload({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    loading = true

    const worker = new Worker(new URL("$lib/workers/import-gtfs-data", import.meta.url), { type: "module" })
    worker.onmessage = (e: MessageEvent<ImportGTFSDataResponse>) => {
      const resp = e.data

      if (resp.type === "progress") {
        progressMessage = resp.message
        return
      }
      
      worker.terminate()
      dispatch("done")
      loading = false
    }

    const request: ImportGTFSDataRequest = {
      gtfsBlob: currentTarget.files![0],
      overrides: $importProfile?.gtfsOverrides
    }
    worker.postMessage(request)
    rotateMessage()
  }

  function rotateMessage() {
    if (rotatingMessages.length === 0) return

    const msg = rotatingMessages[0]
    secondaryMessage = msg
    rotatingMessages.shift()

    rotatingMessageTimeout = setTimeout(rotateMessage, 10000)
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

  onMount(() => {
    return () => clearTimeout(rotatingMessageTimeout)
  })
</script>

<Center>
  <h1>Upload GTFS Feed</h1>

  {#if loading}
    <p>
      {progressMessage}
    </p>

    <p>
      <em>{secondaryMessage}</em>
    </p>
  {:else}
    {#if $stopCount > 0}
      <p>
        You previously imported {$stopCount.toLocaleString()} stops into GTFS Janitor.
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