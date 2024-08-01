<script lang="ts">
  import { readGtfsZip, type GTFSData } from "$lib/gtfs/parser"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"

  const dispatch = createEventDispatcher<{
    gtfsData: GTFSData
  }>()

  async function processUpload({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    const gtfsData = await readGtfsZip(currentTarget.files![0])
    dispatch("gtfsData", gtfsData)
  }
</script>

<Center>
  <h1>GTFS Janitor</h1>
  
  <p>
    Upload a GTFS .zip file to merge bus stop data with OpenStreetMap.
  </p>

  <p>
    <strong>Please note</strong> that this tool will only work with King
    County Metro GTFS data at the moment. It will be made modular in the
    future.
  </p>

  <input
    type="file"
    accept=".zip"
    multiple={false}
    on:change={processUpload} />
</Center>