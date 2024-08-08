<script lang="ts">
  import { profilePresets } from "$lib/pipeline/profile/presets"
  import { importProfile } from "$lib/stores/import-profile"
  import Center from "./Center.svelte"
  import { fetchImportProfile, parseProfile } from "$lib/pipeline/profile"
  import Modal from "./Modal.svelte"

  let selectedPresetIndex = 0
  let profileUrl = ""
  let pastedProfile = ""
  let loading = false

  let showWarning = false

  function usePreset() {
    $importProfile = profilePresets[selectedPresetIndex]
  }

  async function downloadFromUrl() {
    showWarning = false
    loading = true

    try {
      const profile = await fetchImportProfile(profileUrl)
      $importProfile = profile
    } catch(e: any) {
      console.warn(e)
      alert(`Could not fetch profile: ${e.message}`)
    }

    loading = false
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch(e) {
      return false
    }
  }

  async function usePastedProfile() {
    try {
      $importProfile = await parseProfile(pastedProfile)
    } catch (e: any) {
      console.warn(e)
      alert(`Could not parse profile: ${e.message}`)
    }
  }

  $: urlIsValid = validateUrl(profileUrl)
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

  textarea {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    margin-bottom: 1rem;
  }
</style>

<Modal bind:shown={showWarning}>
  <h1>Warning about external profiles</h1>

  <p>
    Import profiles can contain
    <a href="https://mozilla.github.io/nunjucks/" target="_blank">Nunjucks</a>
    templates, which can potentially execute arbitrary JavaScript code. Ensure that
    you trust the source of the profile before using it.
  </p>

  <p>
    You are encouraged to
    <a href={profileUrl} target="_blank">review the profile</a>
    before using it.
  </p>

  <div>
    <button on:click={downloadFromUrl}>I understand, continue</button>
    <button on:click={() => showWarning = false}>Cancel</button>
  </div>
</Modal>

<Center>
  <h1>Configure GTFS Janitor</h1>

  <p>
    To make sure GTFS Janitor works well with your transit agency's
    GTFS data, you need to provide an import profile to tell GTFS Janitor
    how to conflate your GTFS data with OpenStreetMap data. You can learn
    about import profiles and how to make your own
    <a
      href="https://github.com/tjhorner/gtfs-janitor/blob/main/docs/import-profile.md"
      target="_blank"
    >
      in the documentation.
    </a>
  </p>

  <p>
    You can choose a profile using one of the methods below.
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

  <h2>Fetch from URL</h2>

  <div class="stacked">
    <input type="url" placeholder="e.g., https://gist.githubusercontent.com/..." bind:value={profileUrl} />
    <button
      on:click={() => showWarning = true}
      disabled={!urlIsValid || loading}
    >
      Fetch Profile
    </button>
  </div>

  <h2>Paste</h2>

  <textarea bind:value={pastedProfile} placeholder="Paste YAML or JSON profile here" />

  <button on:click={usePastedProfile}>
    Use Pasted Profile
  </button>
</Center>