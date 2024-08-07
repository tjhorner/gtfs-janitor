<script lang="ts">
  import { recommendDisambiguationActions, type DisambiguationRecommendations } from "$lib/pipeline/disambiguator/recommended-actions"
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/session"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { createEventDispatcher } from "svelte"
  import LinkButton from "../LinkButton.svelte"
  import Modal from "../Modal.svelte"
  import DisambiguatorMap from "./DisambiguatorMap.svelte"
  import TagsTable from "./TagsTable.svelte"

  export let matchedStop: MatchedBusStop<AmbiguousBusStopMatch>
  export let canUndo: boolean
  export let initialActions: DisambiguationAction[] | undefined

  let selectedActions: DisambiguationAction[] = [ ]
  let recommendations: DisambiguationRecommendations | null = null

  let showKeyboardShortcuts = false

  const dispatch = createEventDispatcher<{
    submit: DisambiguationAction[],
    undo: void
  }>()

  function getRecommendations() {
    recommendations = recommendDisambiguationActions(matchedStop.match, matchedStop.stop)
    selectedActions = initialActions ?? recommendations?.actions ?? matchedStop.match.elements.map(() => "ignore")
  }

  function submitActions() {
    if (selectedActions.filter(action => action === "match").length > 1) {
      alert("Please select exactly one match for this stop.")
      return
    }

    dispatch("submit", selectedActions)
  }

  function undoActions() {
    dispatch("undo")
  }

  function cycleAction(index: number) {
    if (index + 1 > matchedStop.match.elements.length) return

    const currentAction = selectedActions[index]
    const nextAction = currentAction === "ignore"
      ? "match"
      : currentAction === "match"
        ? "delete"
        : "ignore"

    selectedActions[index] = nextAction
  }

  function handleKeyboardShortcuts(e: KeyboardEvent) {
    if (e.key >= "1" && e.key <= "9") {
      const index = parseInt(e.key) - 1
      cycleAction(index)
    } else if (e.key === "d" || e.key === "ArrowRight") {
      submitActions()
    } else if (e.key === "a" || e.key === "ArrowLeft") {
      undoActions()
    }
  }

  $: matchedStop && getRecommendations()
</script>

<div class="split">
  <div class="info">
    <div>
      <h2>{matchedStop.stop.name} &mdash; <code>{matchedStop.stop.id}</code></h2>

      <p>
        There were no definite matches for this stop on OpenStreetMap. Please review the potential matches below and select the appropriate action for each.
      </p>

      <ul>
        <li><strong>Ignore</strong>: Leave this node as-is.</li>
        <li><strong>Match</strong>: Associate this node with the bus stop and use it for edits.</li>
        <li><strong>Delete</strong>: Delete this node in the exported changeset.</li>
      </ul>

      <p>
        If no match is selected, a new node will be created to represent this bus stop in OpenStreetMap.
      </p>

      <p>
        <strong>Tip</strong>: You can use <LinkButton on:click={() => showKeyboardShortcuts = true}>keyboard shortcuts</LinkButton> to speed up your workflow.
      </p>
    </div>

    <div class="tags">
      <TagsTable
        stopMatch={matchedStop}
        bind:selectedActions={selectedActions}
      />
    </div>

    <div class="controls">
      {#if recommendations}
        <p>
          <span style="font-size: 1.2em">
            <strong>Recommendation</strong>: {recommendations.summary}
          </span>
          <br/>
          {recommendations.reason}
        </p>
      {/if}

      <div class="buttons">
        <button disabled={!canUndo} on:click={undoActions}>
          Undo
        </button>
        <button class="submit" on:click={submitActions}>
          Submit
        </button>
      </div>

      <slot name="controls" />
    </div>
  </div>

  <DisambiguatorMap
    bind:selectedActions={selectedActions}
    {matchedStop}
    {cycleAction}
  />
</div>

<Modal bind:shown={showKeyboardShortcuts}>
  <h2>Keyboard Shortcuts</h2>

  <ul style="padding-left: 1.5em">
    <li>
      <kbd>I</kbd> &mdash; Toggle aerial imagery
    </li>
    <li>
      <kbd>1-9</kbd> &mdash; Cycle through the actions for the corresponding option
    </li>
    <li>
      <kbd>→</kbd> or <kbd>D</kbd> &mdash; Submit the selected actions and go to next stop
    </li>
    <li>
      <kbd>←</kbd> or <kbd>A</kbd> &mdash; Undo the previous actions and go to previous stop
    </li>
  </ul>

  <p>
    You can also click the nodes on the map to cycle through the actions.
  </p>
</Modal>

<svelte:window on:keydown={handleKeyboardShortcuts} />

<style>
  .tags {
    display: block;
    overflow-x: scroll;
    flex-shrink: 0;
    font-family: monospace;
  }

  .split {
    display: flex;
    height: 100%;
  }

  .split > :global(*) {
    flex: 1;
  }

  .info {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow: scroll;
  }

  .info h2 {
    margin-top: 0;
  }

  .info .controls {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-grow: 1;
    gap: 0.75em;
    margin-top: 0.75em;
  }

  .info .controls p {
    margin: 0;
  }

  .info .controls button {
    font-size: 1.5em;
    padding: 0.5rem 3rem;
    color: white;
    background: #6c757d;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .info .controls button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (prefers-color-scheme: dark) {
    .info .controls button {
      background: #404040;
    }

    .info .controls button:disabled {
      background: #6c757d;
    }
  }

  .info .controls button.submit {
    background-color: #007bff;
    flex: 1;
  }

  .info .controls .buttons {
    display: flex;
    gap: 10px;
  }

  kbd {
    font-family: monospace;
    background: #f8f9fa;
    color: #333;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.1em 0.3em;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    font-weight: bold;
  }
</style>