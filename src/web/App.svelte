<script>
  import { Route, Router } from "svelte-routing"
  import Home from "./pages/Home.svelte"
  import client from "./lib/graphql/client"
  import { setClient } from "svelte-apollo"
  import { Modal, Toast } from "@skeletonlabs/skeleton"
  import LoadingOverlay from "./lib/components/LoadingOverlay.svelte"
  import { loadingStore } from "./stores/loading"

  export let url = "/"

  setClient(client)
</script>

<Router {url}>
  <Route path="/" component={Home} />
</Router>

<Modal />
<Toast />

{#if $loadingStore}
  <LoadingOverlay />
{/if}
