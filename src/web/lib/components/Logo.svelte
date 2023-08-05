<script>
  export let invert = false
  export let size = "24px"
  export let fill = "rgba(5, 150, 105, 1)"
  export let stroke = "rgba(255, 255, 255, 1)"
  export let className = ""
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  stroke-width="2.00"
  stroke={invert ? fill : stroke}
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
>
  <rect
    x="0"
    y="0"
    width="100%"
    height="100%"
    stroke="none"
    stroke-width="0"
    fill={invert ? stroke : fill}
    rx="5"
    ry="5"
  />
  <g transform="translate(2.40, 2.40) scale(0.8)">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 12h5v8h4v-16h4v8h5" />
  </g>
</svg>
