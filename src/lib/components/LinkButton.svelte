<style>
  button {
    display: inline;
    background: none !important;
    border: none;
    padding: 0 !important;
    font-family: arial, sans-serif;
    color: var(--link-color);
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
  }
</style>

<button on:click><slot /></button>