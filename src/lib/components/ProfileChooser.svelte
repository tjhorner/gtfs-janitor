<script lang="ts">
  import { profilePresets } from "$lib/pipeline/profile/presets"
  import { importProfile } from "$lib/stores/import-profile"
  import { createEventDispatcher } from "svelte"
  import Center from "./Center.svelte"
  import { fetchImportProfile } from "$lib/pipeline/profile"

  const dispatch = createEventDispatcher<{ done: void }>()

  let selectedPresetIndex = 0
  let url = ""
  let loading = false

  function usePreset() {
    $importProfile = profilePresets[selectedPresetIndex]
  }

  async function downloadFromUrl() {
    loading = true

    try {
      const profile = await fetchImportProfile(url)
      $importProfile = profile
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
    GTFS data, you need to provide an import profile to tell GTFS Janitor
    how to match your GTFS data with OpenStreetMap data. You can learn
    about import profiles and how to make your own
    <a
      href="https://github.com/tjhorner/gtfs-janitor/blob/main/docs/import-profile.md"
      target="_blank"
    >
      in the documentation.
    </a>
  </p>

  <p>
    You can either use one of the presets or enter a URL to a profile.
  </p>

  <h2>Presets</h2>

  <div class="stacked">
    <select bind:value={selectedPresetIndex}>
      {#each profilePresets as { name }, index}
        <option value={index}>{name}</option>
      {/each}
    </select>

    <button on:click={usePreset}>Use Preset</button>
  </div>

  <h2>Enter URL</h2>

  <div class="stacked">
    <input type="url" placeholder="e.g., https://gist.githubusercontent.com/..." bind:value={url} />
    <button on:click={downloadFromUrl} disabled={loading}>Fetch Profile</button>
  </div>
</Center>