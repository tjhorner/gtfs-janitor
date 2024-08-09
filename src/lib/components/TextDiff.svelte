<script lang="ts">
  import { diffChars, diffWords } from "diff"

  export let before: string
  export let after: string
  export let mode: "chars" | "words" = "words"

  $: diff = mode === "chars" ? diffChars(before, after) : diffWords(before, after)
</script>

<style>
  .added {
    color: #006400;
    background-color: #eaf2c2;
  }

  .removed {
    color: #b30000;
    background-color: #fadad7;
    text-decoration: line-through;
  }

  @media (prefers-color-scheme: dark) {
    .added {
      color: #49ff49;
      background-color: rgba(0, 51, 0, 0.5);
    }

    .removed {
      color: #ff4040;
      background-color: rgba(51, 0, 0, 0.5);
    }
  }
</style>

{#each diff as change}
<span class:added={change.added} class:removed={change.removed}>{change.value}</span>
{/each}