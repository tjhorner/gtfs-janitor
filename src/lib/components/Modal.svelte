<script lang="ts">
  import { fade, scale } from "svelte/transition"
  export let shown = false

  function hide() { shown = false }
</script>

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .container {
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    gap: 10px;
  }

  .close-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 1.5rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
  }

  .container :global(*) {
    margin: 0;
  }
</style>

{#if shown}
  <div class="modal" transition:fade={{ duration: 150 }}>
    <div class="container" transition:scale={{ duration: 150, start: 0.7 }}>
      <button class="close-button" on:click={hide}>&times;</button>
      <slot />
    </div>
  </div>
{/if}

<svelte:window on:keydown={e => e.key === "Escape" && (shown = false)} />