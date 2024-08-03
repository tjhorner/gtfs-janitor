<script lang="ts">
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/session"
  import { getColor } from "./colors"

  export let type: "candidate" | "gtfs"
  export let index: number = 0
  export let action: DisambiguationAction = "ignore"
</script>

<style>
  .marker-circle {
    height: 25px;
    width: 25px;
    font-size: 1.5em;
    font-weight: bold;
    border-radius: 100%;
    color: white;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: box-shadow 0.1s ease;
  }

  .marker-circle.gtfs {
    background-color: black;
    color: white;
  }

  .marker-circle.candidate {
    cursor: pointer;
  }

  .marker-circle.match {
    box-shadow: 0 0 5px 8px lime;
  }

  .marker-circle.delete {
    box-shadow: 0 0 5px 8px red;
  }
</style>

<div
  class={`marker-circle ${type} ${action}`}
  style={type === "candidate" ? `background-color: ${getColor(index)}` : ""}
>
  {#if type === "gtfs"}
    S
  {:else}
    {index + 1}
  {/if}
</div>
