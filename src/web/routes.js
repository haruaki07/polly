/**
 * @typedef {Object} Route
 * @prop {string | RegExp} path
 * @prop {import("svelte").SvelteComponent} component
 * @prop {boolean} [rerender] Force re-render on path change
 */

import Admin from "./pages/Admin.svelte"
import Home from "./pages/Home.svelte"

/** @type {Route[]} */
export const routes = [
  { path: "/", component: Home },
  { path: /^\/events\/(?<code>\d+)\/admin/, component: Admin, rerender: true },
]
