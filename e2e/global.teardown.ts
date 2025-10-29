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

teardown("cleanup test data from database", async () => {
  console.log("🧹 Running global teardown...");
  await cleanupTestData();
  console.log("✅ Global teardown completed");
});
