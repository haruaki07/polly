<script>
  import { gql } from "@apollo/client/core"
  import { AppBar } from "@skeletonlabs/skeleton"
  import { produce } from "immer"
  import { query } from "svelte-apollo"
  import Container from "../lib/components/Container.svelte"
  import QuestionBubble from "../lib/components/QuestionBubble.svelte"
  import NotFound from "../lib/routing/NotFound.svelte"
  import { loadingStore } from "../stores/loading"

  /** @type {{code: string}} */
  export let params

  const eventQuery = query(
    gql`
      query eventDetail($code: ID!) {
        event(code: $code) {
          code
          name
          questions {
            id
            content
            username
            upvotes
            created_at
            owner
          }
        }
      }
    `,
    { variables: { code: params.code } }
  )

  // bind query loading state to loading overlay store
  $: $loadingStore = $eventQuery.loading

  // handle subscribtion
  $: if ($eventQuery.data?.event != null) {
    // subscribe to new questions
    eventQuery.subscribeToMore({
      document: gql`
        subscription SubscribeEventQuestions {
          eventNewQuestion {
            id
            content
            upvotes
            username
            created_at
            owner
          }
        }
      `,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const newQuestion = subscriptionData.data.eventNewQuestion
        const exists = prev.event.questions.find(
          ({ id }) => id === newQuestion.id
        )
        if (exists) return prev

        return produce(prev, (draft) => {
          draft.event.questions.unshift(newQuestion)
        })
      },
    })

    // subscribe to questions upvote
    eventQuery.subscribeToMore({
      document: gql`
        subscription SubscribeEventQuestions {
          eventQuestionsUpvote {
            question_id
            upvotes
          }
        }
      `,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const upvote = subscriptionData.data.eventQuestionsUpvote

        return produce(prev, (draft) => {
          const q = draft.event.questions.find(
            (q) => q.id === upvote.question_id
          )
          q.upvotes = upvote.upvotes
        })
      },
    })

    // subscribe to deleted questions
    eventQuery.subscribeToMore({
      document: gql`
        subscription SubscribeEventQuestions {
          eventDeleteQuestion
        }
      `,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const questionId = subscriptionData.data.eventDeleteQuestion

        return produce(prev, (draft) => {
          draft.event.questions = draft.event.questions.filter(
            (q) => q.id !== questionId
          )
        })
      },
    })
  }

  $: sortedQuestions = [...($eventQuery.data?.event?.questions ?? [])].sort(
    (a, b) =>
      b.upvotes - a.upvotes || new Date(b.created_at) - new Date(a.created_at)
  )
</script>

{#key params.code}
  {#if $eventQuery.error}
    An error occurred: {$eventQuery.error.message}.
  {:else if $eventQuery.data?.event}
    <div class="flex-shrink-0">
      <AppBar
        border="border-b border-surface-500/30"
        gridColumns="grid-cols-3 max-w-5xl w-full mx-auto"
        slotDefault="flex items-center"
      >
        <h4 class="h4 font-bold" slot="lead">{$eventQuery.data.event.name}</h4>
        <div
          class="flex flex-col w-full place-items-center text-center truncate"
        >
          <span class="badge variant-soft-primary">
            #{$eventQuery.data.event.code}
          </span>
        </div>
      </AppBar>
    </div>

    <Container
      center
      className="py-4 grid grid-cols-5 flex-1 overflow-y-hidden px-4 lg:px-0"
    >
      <div
        class="card bg-white/10 p-4 flex flex-col gap-y-4 col-span-3 overflow-y-auto h-full"
      >
        {#each sortedQuestions as question (question.id)}
          <QuestionBubble {question} />
        {:else}
          No questions
        {/each}
      </div>
    </Container>
  {:else if !$eventQuery.loading}
    <NotFound />
  {/if}
{/key}
