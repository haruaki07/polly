<script>
  // import ChevronDown from "./Icons/ChevronDown.svelte"
  import ChevronUp from "./Icons/ChevronUp.svelte"
  import Trash from "./Icons/Trash.svelte"
  import { scale } from "svelte/transition"

  export let question
</script>

<div
  class="card p-4 variant-soft rounded-tl-none space-y-2 group"
  transition:scale
>
  <header class="flex justify-between items-center">
    <p class="font-bold">{question.username ?? "Anonymous"}</p>
    <small class="opacity-50">
      {new Date(question.created_at).toISOString()}
    </small>
  </header>
  <p class="text-sm">
    {question.content}
  </p>
  <div class="flex items-center justify-between">
    <div class="inline-flex items-center gap-x-2">
      <span class="badge" title="10 Upvotes">
        <ChevronUp />
        {question.upvotes}
      </span>
    </div>

    <div class="group-hover:opacity-100 opacity-0">
      <button type="button" class="btn-icon btn-icon-sm variant-soft-error">
        <Trash />
      </button>
    </div>
  </div>
</div>
