<script>
  import { gql } from "@apollo/client/core"
  import { AppBar, modalStore, toastStore } from "@skeletonlabs/skeleton"
  import { mutation } from "svelte-apollo"
  import Container from "../lib/components/Container.svelte"
  import Logo from "../lib/components/Logo.svelte"
  import Spinner from "../lib/components/Spinner.svelte"
  import { loadingStore } from "../stores/loading"

  const joinEvent = mutation(gql`
    mutation JoinEvent($event_code: ID!) {
      joinEvent(code: $event_code) {
        success
        message
        token
      }
    }
  `)

  const createEvent = mutation(gql`
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent(input: $input) {
        code
        name
      }
    }
  `)

  let code = ""
  let isJoinning = false

  /**
   * The order of `on:input` and `bind:value` matters.
   *
   * @param {Event & { currentTarget: EventTarget & HTMLInputElement }} e
   **/
  const handleCodeChange = (e) => {
    let value = e.currentTarget.value
    if (value.length > 6) {
      e.currentTarget.value = `${code}`
      return
    }

    e.currentTarget.value = value.replace(/[^0-9]/g, "")
  }

  const handleJoin = async () => {
    try {
      if (!code) {
        toastStore.trigger({
          message: `Please input event code!`,
          background: "variant-filled-error",
        })
        return
      }

      isJoinning = true
      const res = await joinEvent({ variables: { event_code: code } })
      if (!res.data.joinEvent.success) {
        toastStore.trigger({
          message: `Failed to join event #${code}! ${res.data.joinEvent.message}`,
          background: "variant-filled-error",
        })
        return
      }

      toastStore.trigger({
        message: `Joined to event #${code}`,
        background: "variant-filled-success",
      })
    } catch (e) {
      console.error(e)
      toastStore.trigger({
        message: `Failed to join event #${code}! An error occurred!`,
        background: "variant-filled-error",
      })
    } finally {
      isJoinning = false
    }
  }

  const handleCreateEvent = () => {
    new Promise((resolv) => {
      modalStore.trigger({
        modalClasses: "!w-modal-slim",
        type: "prompt",
        title: "Create Event",
        body: "Enter your event name.",
        valueAttr: { type: "text", required: true },
        response: resolv,
      })
    }).then(async (name) => {
      if (name) {
        try {
          $loadingStore = true
          const res = await createEvent({ variables: { input: { name } } })

          toastStore.trigger({
            message: `Event #${res.data.createEvent.code} created! Navigating...`,
            background: "variant-filled-success",
          })
        } catch (e) {
          console.error(e)
          toastStore.trigger({
            message: `Failed to create event! An error occurred.`,
            background: "variant-filled-error",
          })
        } finally {
          $loadingStore = false
        }
      }
    })
  }
</script>

<div class="sticky top-0 z-10 border-b border-surface-400-500-token">
  <AppBar gridColumns="grid-cols-1" slotDefault="flex items-center">
    <Container center>
      <a class="inline-flex items-center gap-x-2" href="/">
        <Logo />
        <h4 class="h4 font-bold">Polly</h4>
      </a>
    </Container>
  </AppBar>
</div>

<div class="px-4">
  <Container center className="flex flex-col items-center">
    <div class="inline-flex flex-col mt-24 items-center">
      <div class="relative">
        <span class="absolute top-1.5 left-3 text-primary-500 text-2xl z-[6]">
          #
        </span>
        <input
          type="text"
          class="input pl-10 tracking-[4px] placeholder:tracking-normal"
          placeholder="Enter code here"
          pattern="[0-9]*"
          inputmode="numeric"
          on:input={handleCodeChange}
          bind:value={code}
        />
      </div>
      <button
        type="button"
        class="btn variant-filled mt-4 inline-flex items-center"
        on:click={handleJoin}
        disabled={isJoinning}
      >
        {#if isJoinning}
          <Spinner size="20px" className="mr-2" />
        {/if}
        Join Event
      </button>
      <button
        type="button"
        class="anchor text-xs mt-2"
        on:click={handleCreateEvent}
      >
        or create event
      </button>
    </div>
  </Container>
</div>
