<style>
  .center {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
  }

  .center .container {
    max-width: 600px;
  }
</style>

<div class="center">
  <div class="container">
    <slot />
  </div>
</div>