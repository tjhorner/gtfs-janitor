<script lang="ts">
  export let options: {
    label: string,
    value: string
  }[] = [ ]

  export let value: string = ""
</script>

<style>
  .options {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
  }

  .button {
    flex-grow: 1;
    padding: 5px 10px;
    color: black;
    background-color: #d9d9d9;
    border: none;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.1s ease, transform 0.1s ease;
  }

  @media (prefers-color-scheme: dark) {
    .button {
      background-color: #333;
      color: white;
    }
  }

  .button:has(input:checked) {
    background-color: #007bff;
    color: white;
  }

  label {
    position: relative;
  }

  input[type="radio"] {
    z-index: -999;
    height: 1px;
    width: 1px;
    opacity: 0;
    appearance: none;
    position: absolute;
    bottom: 0;
    left: 50%;
  }
</style>

<div class="options">
  {#each options as option}
    <label
      class="button"
    >
      <input
        type="radio"
        bind:group={value}
        value={option.value}
      />

      {option.label}
    </label>
  {/each}
</div>