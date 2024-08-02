<script lang="ts">
  import type { DisambiguationAction } from "$lib/pipeline/disambiguator/actions"
  import type { AmbiguousBusStopMatch, MatchedBusStop } from "$lib/pipeline/matcher/bus-stops"
  import { recommendDisambiguationActions, type DisambiguationRecommendations } from "$lib/pipeline/disambiguator/recommended-actions"
  import { createEventDispatcher } from "svelte"
  import LinkButton from "../LinkButton.svelte"
  import Modal from "../Modal.svelte"
  import DisambiguatorMap from "./DisambiguatorMap.svelte"
  import TagsTable from "./TagsTable.svelte"

  export let matchedStop: MatchedBusStop<AmbiguousBusStopMatch>

  let recommendations: DisambiguationRecommendations | null = null
  let selectedActions: DisambiguationAction[] = [ ]

  let showKeyboardShortcuts = false

  const dispatch = createEventDispatcher<{
    submit: DisambiguationAction[]
  }>()

  function getRecommendations() {
    recommendations = recommendDisambiguationActions(matchedStop)
    selectedActions = recommendations?.actions ?? matchedStop.match.elements.map(() => "ignore")
  }

  function submitActions() {
    if (selectedActions.filter(action => action === "match").length > 1) {
      alert("Please select exactly one match for this stop.")
      return
    }

    dispatch("submit", selectedActions)
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
    } else if (e.key === "Enter" || e.key === "s") {
      submitActions()
    }
  }

  $: matchedStop && getRecommendations()
</script>

<div class="split">
  <div class="info">
    <div>
      <h2>{matchedStop.stop.stop_name} &mdash; <code>{matchedStop.stop.stop_id}</code></h2>

      <p>
        There were multiple possible matches in OpenStreetMap for this stop. Please specify what to do
        with each of the possible matches.
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
        match={matchedStop.match}
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

      <button class="submit" on:click={submitActions}>
        Next
      </button>

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
  <h2>Tips</h2>

  <p>
    You can use the following keyboard shortcuts to speed up your workflow:
  </p>

  <ul style="padding-left: 1.5em">
    <li>
      <strong><kbd>A</kbd></strong>: Toggle aerial imagery
    </li>
    <li>
      <strong><kbd>1-9</kbd></strong>: Cycle through the actions for the corresponding option
    </li>
    <li>
      <strong><kbd>Enter</kbd> or <kbd>S</kbd></strong>: Submit the selected actions and go to next stop
    </li>
  </ul>

  <p>
    You can also click the nodes on the map to cycle through the actions.
  </p>
</Modal>

<svelte:window on:keydown={handleKeyboardShortcuts} on:beforeunload|preventDefault />

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

  .info .controls button.submit {
    font-size: 1.5em;
    padding: 0.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>