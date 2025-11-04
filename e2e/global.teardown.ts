/**
 * Global Teardown for E2E Tests
 *
 * This teardown runs ONCE after all E2E tests complete.
 * It cleans up test data from the database.
 *
 * Uses Playwright's teardown feature with project dependencies:
 * https://playwright.dev/docs/test-global-setup-teardown#option-1-project-dependencies
 */

import { test as teardown } from "@playwright/test";
import { cleanupTestData } from "./helpers/cleanup";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.test for cleanup (local only)
// On CI, env vars are set in workflow, so skip loading from file
if (!process.env.CI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envFile = process.env.E2E_ENV_FILE || ".env.test";
  dotenv.config({ path: path.resolve(__dirname, "..", envFile) });
}

teardown("cleanup test data from database", async () => {
  console.log("🧹 Running global teardown...");
  await cleanupTestData();
  console.log("✅ Global teardown completed");
});
