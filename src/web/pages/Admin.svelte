<script>
  import { AppBar } from "@skeletonlabs/skeleton"
  import AdminTabs from "../lib/components/AdminTabs.svelte"
  import Container from "../lib/components/Container.svelte"
  import QuestionBubble from "../lib/components/QuestionBubble.svelte"

  /** @type {{id: string}} */
  export let params
</script>

<div class="sticky top-0 z-10">
  <AppBar
    border="border-b border-surface-500/30"
    gridColumns="grid-cols-3 max-w-5xl w-full mx-auto"
    slotDefault="flex items-center"
  >
    <h4 class="h4 font-bold" slot="lead">Event Name Bla</h4>

    <div class="flex flex-col w-full place-items-center text-center truncate">
      <span class="badge variant-soft-primary">#{params.id}</span>
    </div>
  </AppBar>
</div>

<AdminTabs />

<Container center className="mt-4 grid grid-cols-5">
  <div class="card bg-white/10 p-4 col-span-3">
    <QuestionBubble />
  </div>
</Container>
