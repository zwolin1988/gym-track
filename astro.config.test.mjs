// @ts-check
/* eslint-env node */
// Astro config for E2E tests - uses Node adapter for faster local testing
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    // Pass env vars from process.env to import.meta.env for E2E tests
    // This ensures vars loaded by dotenv-cli are available in middleware
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY),
      "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(process.env.OPENROUTER_API_KEY),
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
