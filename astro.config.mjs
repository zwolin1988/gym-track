// @ts-check
import { defineConfig } from "astro/config";
import { config as loadDotenv } from "dotenv";
import { resolve } from "path";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// Detect if running on Cloudflare Pages or explicitly requested
const isCloudflare = process.env.CF_PAGES || process.env.USE_CLOUDFLARE === "true";

// Load environment variables from the correct .env file
// This supports E2E tests which use .env.test (via E2E_ENV_FILE)
const envFile = process.env.E2E_ENV_FILE || ".env";
loadDotenv({ path: resolve(process.cwd(), envFile) });

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    // Make env vars available in import.meta.env for runtime access
    // This ensures E2E tests with .env.test work correctly
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY),
      "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(process.env.OPENROUTER_API_KEY),
    },
  },
  adapter: isCloudflare
    ? cloudflare({
        imageService: "passthrough",
      })
    : node({
        mode: "standalone",
      }),
});
