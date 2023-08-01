<script>
  import clsx from "clsx"

  export let center = false
  export let className = ""
</script>

<div class={clsx("max-w-5xl w-full", center && "mx-auto", className)}>
  <slot />
</div>
