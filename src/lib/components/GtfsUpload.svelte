<script lang="ts">
  import { readGtfsZip, type GTFSData } from "$lib/gtfs/parser"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"
  import { importConfig } from "$lib/stores/import-config"

  const dispatch = createEventDispatcher<{
    gtfsData: GTFSData
  }>()

  async function processUpload({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    const gtfsData = await readGtfsZip(currentTarget.files![0])
    dispatch("gtfsData", gtfsData)
  }

  function changeConfig() {
    $importConfig = null
  }
</script>

<Center>
  <h1>Upload GTFS Feed</h1>
  
  <p>
    Upload a GTFS .zip file to merge bus stop data with OpenStreetMap.
  </p>

  <input
    type="file"
    accept=".zip"
    multiple={false}
    on:change={processUpload} />

  <h2>Current Config</h2>
  
  <p>
    You are currently using the config <strong>{$importConfig?.name}</strong>.
  </p>

  <button on:click={changeConfig}>Change Config</button>
</Center>