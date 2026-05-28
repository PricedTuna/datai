import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// LM Studio host the dev proxy forwards to. Override with VITE_LMSTUDIO_HOST.
const LM_STUDIO_HOST = process.env.VITE_LMSTUDIO_HOST || "http://127.0.0.1:1234";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Locally built loon-core (../LOON/dist) — used by the "Local build"
      // option in the chat dataset dialog. Refresh it with `pnpm loon:build`.
      "@loon-local": path.resolve(__dirname, "../LOON/dist/index.mjs"),
      "@loon-local-pkg": path.resolve(__dirname, "../LOON/package.json"),
    },
  },
  server: {
    // Same-origin proxy to LM Studio: the browser calls /lmstudio/v1/... on
    // :5173, Vite forwards to the LM Studio server. This sidesteps CORS
    // entirely (LM Studio's OpenAI server does not emit CORS headers, so a
    // direct browser fetch is blocked at the preflight).
    proxy: {
      "/lmstudio": {
        target: LM_STUDIO_HOST,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/lmstudio/, ""),
      },
    },
  },
})
