<script>
  import { AppBar } from "@skeletonlabs/skeleton"
  import Container from "../lib/components/Container.svelte"
  import Logo from "../lib/components/Logo.svelte"
</script>

<div class="sticky top-0 z-10">
  <AppBar gridColumns="grid-cols-1">
    <Container center>
      <a class="inline-flex items-center gap-x-2" href=".">
        <Logo />
        <h4 class="h4 font-bold">Polly</h4>
      </a>
    </Container>
  </AppBar>
</div>

<div class="px-4">
  <Container center className="flex flex-col items-center">
    <div class="inline-flex flex-col mt-24 items-center">
      <input
        type="number"
        class="input input-lg input-no-arrow"
        placeholder="Enter code here"
      />
      <button type="button" class="btn variant-filled mt-4 max-w-[128px]">
        Join Event
      </button>
      <button type="button" class="anchor text-xs mt-2">
        or create event
      </button>
    </div>
  </Container>
</div>
