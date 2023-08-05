<script>
  import { path, pattern } from "svelte-pathfinder"

  /** @type {import("../../routes").Route[]} */
  export let routes

  let params
  $: page = routes.find((route) => (params = $pattern(route.path))) || null
</script>

{#if page}
  {#if page.rerender}
    {#key $path}
      <svelte:component this={page.component} {params} />
    {/key}
  {:else}
    <svelte:component this={page.component} {params} />
  {/if}
{:else}
  404
{/if}
