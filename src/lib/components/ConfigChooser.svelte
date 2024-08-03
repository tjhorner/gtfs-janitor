<script lang="ts">
  import { configPresets } from "$lib/pipeline/config/presets"
  import { importConfig } from "$lib/stores/import-config"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"
  import { fetchImportConfig } from "$lib/pipeline/config"

  const dispatch = createEventDispatcher<{ done: void }>()

  let selectedPresetIndex = 0
  let url = ""
  let loading = false

  function usePreset() {
    $importConfig = configPresets[selectedPresetIndex]
  }

  function changeConfig() {
    $importConfig = null
  }

  async function downloadFromUrl() {
    loading = true

    try {
      const config = await fetchImportConfig(url)
      $importConfig = config
    } catch(e) {
      alert(e)
    }

    loading = false
  } 

  function next() {
    dispatch("done")
  }
</script>

<style>
  .stacked {
    display: flex;
    flex-direction: row;
    gap: 1rem;
  }

  .stacked select, .stacked input {
    flex: 1;
  }
</style>

<Center>
  <h1>Configure GTFS Janitor</h1>

  <p>
    To make sure GTFS Janitor works well with your transit agency's
    GTFS data, you need to provide a config file to tell GTFS Janitor
    how to match your GTFS data to OpenStreetMap data. You can learn
    about the format
    <a
      href="https://github.com/tjhorner/gtfs-janitor/blob/main/docs/config.md"
      target="_blank"
    >
      in the documentation.
    </a>
  </p>

  <p>
    You can either use one of the presets or enter a URL to a config file.
  </p>

  <h2>Presets</h2>

  <div class="stacked">
    <select bind:value={selectedPresetIndex}>
      {#each configPresets as { name }, index}
        <option value={index}>{name}</option>
      {/each}
    </select>

    <button on:click={usePreset}>Use Preset</button>
  </div>

  <h2>Enter URL</h2>

  <div class="stacked">
    <input type="url" placeholder="e.g., https://gist.githubusercontent.com/..." bind:value={url} />
    <button on:click={downloadFromUrl} disabled={loading}>Fetch Config</button>
  </div>
</Center>