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
    // Astro automatically loads .env files and makes them available as import.meta.env
    // No need for vite.define - let Astro handle it
  },
  adapter: node({
    mode: "standalone",
  }),
});
