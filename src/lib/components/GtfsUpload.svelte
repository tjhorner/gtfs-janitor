<script lang="ts">
  import { readGtfsZip } from "$lib/gtfs/parser"
  import { importProfile } from "$lib/stores/import-profile"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"
  import type { GTFSData } from "$lib/gtfs/types"

  const dispatch = createEventDispatcher<{
    gtfsData: GTFSData
  }>()

  let loading = false

  async function processUpload({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    loading = true

    const gtfsData = await readGtfsZip(currentTarget.files![0])
    dispatch("gtfsData", gtfsData)

    loading = false
  }

  function changeProfile() {
    $importProfile = null
  }
</script>

<Center>
  <h1>Upload GTFS Feed</h1>
  
  <p>
    Upload a GTFS .zip file to merge bus stop data with OpenStreetMap.
  </p>

  {#if loading}
    <p>
      Processing GTFS data... (this can take a while)
    </p>
  {:else}
    <input
      type="file"
      accept=".zip"
      multiple={false}
      on:change={processUpload} />

    <h2>Current Profile</h2>

    <p>
      You are currently using the import profile "<strong>{$importProfile?.name}</strong>".
    </p>

    <button on:click={changeProfile}>Change Profile</button>
  {/if}
</Center>