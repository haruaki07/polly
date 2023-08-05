<script>
  import { TabAnchor, TabGroup } from "@skeletonlabs/skeleton"
  import Container from "./Container.svelte"
  import { query } from "svelte-pathfinder"

  $: tab = $query.tab ?? "questions"
</script>

<div class="bg-surface-100-800-token border-b border-surface-500/30">
  <Container center>
    <TabGroup border="border-0" padding="px-5 py-2.5">
      <TabAnchor href="/events/:id/admin" selected={tab === "questions"}>
        Questions
      </TabAnchor>
    </TabGroup>
  </Container>
</div>
