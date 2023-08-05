/**
 * @typedef {{
 *   path: string | RegExp,
 *   component: import("svelte").SvelteComponent
 * }} Route
 */

import Admin from "./pages/Admin.svelte"
import Home from "./pages/Home.svelte"

/** @type {Route[]} */
export const routes = [
  { path: "/", component: Home },
  { path: "/events/:id/admin/", component: Admin },
]
