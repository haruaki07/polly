<script>
  import { TabAnchor, TabGroup } from "@skeletonlabs/skeleton"
  import Container from "./Container.svelte"
  import { query } from "svelte-pathfinder"

  export let eventCode

  $: tab = $query.tab ?? "questions"
</script>

<div
  class="bg-surface-100-800-token border-b border-surface-500/30 px-4 lg:px-0"
>
  <Container center>
    <TabGroup border="border-0" padding="px-5 py-2.5">
      <TabAnchor
        href="/events/{eventCode}/admin"
        selected={tab === "questions"}
      >
        Questions
      </TabAnchor>
    </TabGroup>
  </Container>
</div>
