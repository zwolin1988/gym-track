// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// Detect if running on Cloudflare Pages or explicitly requested
const isCloudflare = process.env.CF_PAGES || process.env.USE_CLOUDFLARE === "true";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: isCloudflare
    ? cloudflare({
        imageService: "passthrough",
      })
    : node({
        mode: "standalone",
      }),
});
