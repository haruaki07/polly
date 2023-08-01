import { svelte } from "@sveltejs/vite-plugin-svelte"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [svelte()],
  root: join(__dirname, "src", "web"),
  build: {
    emptyOutDir: true,
    outDir: join(__dirname, "dist"),
  },
})
