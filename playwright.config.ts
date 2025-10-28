import { defineConfig, devices } from "@playwright/test";

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

  // Fully parallel execution (per cursor rules)
  fullyParallel: true,

  // Fail the build on CI if tests were accidentally left as .only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

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
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
