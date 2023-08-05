<script>
  import { Modal, Toast } from "@skeletonlabs/skeleton"
  import { setClient } from "svelte-apollo"
  import LoadingOverlay from "./lib/components/LoadingOverlay.svelte"
  import client from "./lib/graphql/client"
  import { loadingStore } from "./stores/loading"
  import Router from "./lib/routing/Router.svelte"
  import { routes } from "./routes"
  import { click } from "svelte-pathfinder"

  setClient(client)
</script>

<svelte:window on:click={click} />
<Router {routes} />

<Modal />
<Toast />

{#if $loadingStore}
  <LoadingOverlay />
{/if}
