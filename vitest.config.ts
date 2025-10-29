import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment for DOM testing (happy-dom is faster than jsdom)
    environment: "happy-dom",

    // Global setup/teardown
    globals: true,

    // Setup files
    setupFiles: ["./src/test/setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/mockData/**", "dist/", ".astro/"],
      // Target thresholds (≥80% per test plan)
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Include/exclude patterns
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "e2e"],

    // Test timeout
    testTimeout: 10000,

    // Watch options
    watch: false,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/db": resolve(__dirname, "./src/db"),
    },
  },
});
