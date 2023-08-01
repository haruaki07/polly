<script>
  // @ts-nocheck
  import { Route, Router } from "svelte-routing"
  import Home from "./pages/Home.svelte"
  import client from "./lib/graphql/client"
  import { setClient } from "svelte-apollo"
  import { Toast } from "@skeletonlabs/skeleton"

  export let url = "/"

  setClient(client)
</script>

<Router {url}>
  <Route path="/" component={Home} />
</Router>

<Toast />
