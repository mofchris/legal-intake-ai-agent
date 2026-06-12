import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// On GitHub Pages the app is served from /<repo>/, so production assets need
// that base path. Dev keeps "/". Override with VITE_BASE if the repo is renamed.
const PROD_BASE = process.env.VITE_BASE ?? "/legal-intake-ai-agent/"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? PROD_BASE : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
