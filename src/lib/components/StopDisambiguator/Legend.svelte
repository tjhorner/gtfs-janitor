<script lang="ts">
  import type { AmbiguousBusStopMatch } from "$lib/pipeline/matcher/bus-stops"
  import NodeMarker from "./NodeMarker.svelte"

  export let match: AmbiguousBusStopMatch
</script>

<style>
  .legend {
    display: flex;
    flex-direction: column;
    padding: 8px;
  }

  .legend h3 {
    margin: 0;
    margin-bottom: 3px;
  }

  .legend .item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .legend :global(.marker-circle) {
    transform: scale(0.8);
    cursor: default !important;
    user-select: none;
  }
</style>

<div class="legend">
  <h3>Legend</h3>
  <div class="item">
    <NodeMarker type="gtfs" />
    <span>Stop from GTFS data</span>
  </div>
  {#each match.elements as element, index}
    <div class="item">
      <NodeMarker type="candidate" index={index} />
      <span>Node {element.id}</span>
    </div>
  {/each}
</div>