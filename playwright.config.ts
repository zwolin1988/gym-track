import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on E2E_ENV_FILE variable
// - For CI/CD: env vars are set in workflow, no need to load file
// - For local (test:e2e): uses .env.test (default)
// - For local UI (test:e2e:ui): uses .env
if (!process.env.CI) {
  const envFile = process.env.E2E_ENV_FILE || ".env.test";
  dotenv.config({ path: path.resolve(__dirname, envFile) });
}

/**
 * Playwright Configuration for E2E Testing
 *
 * Based on project rules:
 * - Initialize with Chromium/Desktop Chrome only (as per cursor rules)
 * - Use browser contexts for test isolation
 * - Implement Page Object Model pattern
 * - Use locators for resilient element selection
 * - Leverage parallel execution
 */

export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Test file pattern
  testMatch: "**/*.spec.ts",

  // Run tests serially to avoid env var conflicts with webServer
  fullyParallel: false,

  // Fail the build on CI if tests were accidentally left as .only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use 1 worker to ensure tests run serially and share the same server
  workers: 1,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace on failure (for trace viewer debugging per cursor rules)
    trace: "on-first-retry",

    // Screenshot on failure (visual comparison per cursor rules)
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Browser context options
    contextOptions: {
      // Ignore HTTPS errors (for development/staging)
      ignoreHTTPSErrors: true,
    },
  },

  // Projects configuration - Chromium/Desktop Chrome only (per cursor rules)
  projects: [
    // Setup project - runs first to authenticate and save state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      teardown: "cleanup", // Run cleanup after all tests complete
    },

    // Teardown project - runs AFTER all tests complete to clean up database
    {
      name: "cleanup",
      testMatch: /.*\.teardown\.ts/,
    },

    // Project for authentication-specific tests (login, logout, etc.)
    // These tests don't use the shared auth state
    {
      name: "auth-tests",
      testMatch: /.*auth.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        // No storageState - these tests handle auth themselves
      },
      dependencies: ["setup"],
    },

    // Main test project - uses authenticated state from setup
    // Excludes auth tests (handled by auth-tests project)
    {
      name: "chromium",
      testIgnore: /.*auth.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        // Use authenticated state from setup project
        storageState: "./playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Web server configuration
  webServer: {
    // Use test config (astro.config.test.mjs) with Node adapter for E2E tests
    // This avoids Cloudflare runtime issues and uses simpler Node.js server
    // In CI: env vars are already set in workflow, so no need for dotenv-cli
    // Locally: use dotenv-cli to load .env.test
    command: process.env.CI
      ? "npm run dev -- --config astro.config.test.mjs"
      : `npx dotenv-cli -e ${process.env.E2E_ENV_FILE || ".env.test"} -- npm run dev -- --config astro.config.test.mjs`,
    url: "http://localhost:3000",
    // Reuse server for development (faster), but not in CI
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
