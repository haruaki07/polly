<script>
  import { mutation } from "svelte-apollo"

  // import ChevronDown from "./Icons/ChevronDown.svelte"
  import ChevronUp from "./Icons/ChevronUp.svelte"
  import Trash from "./Icons/Trash.svelte"
  import { scale } from "svelte/transition"
  import { gql } from "@apollo/client/core"
  import { toastStore } from "@skeletonlabs/skeleton"

  export let question
  let upvoted = !question.canUpvote
  let isUpvoting = false

  const deleteQuestionMutation = mutation(gql`
    mutation DeleteQuestion($input: DeleteQuestionInput!) {
      deleteQuestion(input: $input) {
        success
        message
      }
    }
  `)

  const upvoteQuestionMutation = mutation(gql`
    mutation UpvoteQuestion($input: UpvoteQuestionInput!) {
      upvoteQuestion(input: $input)
    }
  `)

  const undoUpvoteQuestionMutation = mutation(gql`
    mutation UndoUpvoteQuestion($input: UpvoteQuestionInput!) {
      undoUpvoteQuestion(input: $input)
    }
  `)

  const handleDelete = async () => {
    try {
      await deleteQuestionMutation({
        variables: { input: { id: question.id } },
      })
    } catch (e) {
      console.error(e)
      toastStore.trigger({
        message: `Failed to delete question! An error occurred.`,
        background: "variant-filled-error",
      })
    }
  }

  const handleToggleUpvote = async () => {
    try {
      isUpvoting = true
      if (!upvoted) {
        await upvoteQuestionMutation({
          variables: { input: { id: question.id } },
        })
        upvoted = true
      } else {
        await undoUpvoteQuestionMutation({
          variables: { input: { id: question.id } },
        })
        upvoted = false
      }
    } catch (e) {
      console.error(e)
      toastStore.trigger({
        message: `Failed to ${
          upvote ? "upvoted" : "undo upvote"
        }! An error occurred.`,
        background: "variant-filled-error",
      })
    } finally {
      isUpvoting = false
    }
  }
</script>

<div
  class="card p-4 variant-soft space-y-2 group"
  transition:scale={{ duration: 200 }}
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
      <button
        type="button"
        class="badge"
        class:text-secondary-500={question.upvotes > 2}
        class:variant-soft-secondary={upvoted}
        title="10 Upvotes"
        disabled={isUpvoting}
        on:click={handleToggleUpvote}
      >
        <ChevronUp />
        {question.upvotes}
      </button>
    </div>

    {#if question.owner}
      <div class="group-hover:opacity-100 opacity-0">
        <button
          type="button"
          class="btn-icon btn-icon-sm variant-soft-error"
          on:click={handleDelete}
        >
          <Trash />
        </button>
      </div>
    {/if}
  </div>
</div>
