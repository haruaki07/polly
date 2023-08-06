<script>
  import { gql } from "@apollo/client/core"
  import { mutation } from "svelte-apollo"
  import Spinner from "./Spinner.svelte"
  import { toastStore } from "@skeletonlabs/skeleton"

  /** @type {HTMLTextAreaElement} */
  let contentEl
  let content = ""
  let username = ""
  let isSending = false

  const createQuestionMutation = mutation(gql`
    mutation CreateQuestion($input: CreateQuestionInput!) {
      createQuestion(input: $input) {
        id
        content
        upvotes
        username
        created_at
        owner
      }
    }
  `)

  const handleSubmit = async () => {
    try {
      isSending = true
      const input = { content }
      if (username.trim()) input.username = username
      await createQuestionMutation({ variables: { input } })

      content = ""
      contentEl.focus()
    } catch (e) {
      console.error(e)
      toastStore.trigger({
        message: `Failed to send question! An error occurred.`,
        background: "variant-filled-error",
      })
    } finally {
      isSending = false
    }
  }
</script>

<form class="card bg-white/10 p-4" on:submit|preventDefault={handleSubmit}>
  <textarea
    bind:this={contentEl}
    class="textarea pb-4 scroll-pb-4"
    placeholder="Enter your question here"
    rows="3"
    maxlength="255"
    required
    bind:value={content}
  />
  <div class="flex gap-x-2">
    <input
      type="text"
      class="input flex-1"
      maxlength="20"
      placeholder="Your name (optional)"
      bind:value={username}
    />
    <button
      type="submit"
      class="btn variant-filled flex-shrink-0 w-28 flex items-center"
      disabled={isSending}
    >
      {#if isSending}
        <Spinner className="mr-2" size="14px" />
      {/if}
      Send
    </button>
  </div>
</form>
