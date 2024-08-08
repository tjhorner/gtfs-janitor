<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fade, scale } from "svelte/transition"
  import { clickoutside } from "@svelte-put/clickoutside"

  const dispatch = createEventDispatcher<{ hide: void }>()

  export let shown = false

  let container: HTMLDivElement

  function hide() {
    shown = false
    dispatch("hide")
  }
</script>

<style>
  .container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .modal {
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    gap: 10px;
    max-width: 600px;
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

  @media (prefers-color-scheme: dark) {
    .modal {
      background-color: #333;
      color: white;
    }

    .close-button {
      color: white;
    }
  }

  .modal :global(*) {
    margin: 0;
  }
</style>

{#if shown}
  <div bind:this={container} class="container" transition:fade={{ duration: 150 }}>
    <div
      class="modal"
      use:clickoutside={{ limit: { parent: container } }}
      on:clickoutside={hide}
      transition:scale={{ duration: 150, start: 0.7 }}
    >
      <button class="close-button" on:click={hide}>&times;</button>
      <slot />
    </div>
  </div>
{/if}

<svelte:window on:keydown={e => e.key === "Escape" && hide()} />