<script>
  import { pattern } from "svelte-pathfinder"

  /** @type {import("../../routes").Route[]} */
  export let routes

  let params
  $: page = routes.find((route) => (params = $pattern(route.path))) || null
</script>

{#if page}
  <svelte:component this={page.component} {params} />
{:else}
  404
{/if}
