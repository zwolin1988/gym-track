/**
 * Global Authentication Setup for E2E Tests
 *
 * This setup file logs in once before all tests and saves the authenticated state.
 * Other tests can then reuse this state instead of logging in repeatedly.
 *
 * Benefits:
 * - Faster test execution (login happens once)
 * - Better separation of concerns (auth logic in one place)
 * - Reusable authentication state across all test files
 *
 * Based on: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 */

import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { TEST_USERS } from "./fixtures/auth";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Perform login with test credentials from .env.test
  await loginPage.loginAndWaitForNavigation(TEST_USERS.valid.email, TEST_USERS.valid.password);

  // Verify we're authenticated by checking we're on dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole("heading", { name: "Szybkie akcje", level: 2 })).toBeVisible();

  // Save authenticated state to file
  // This will be reused by other tests that specify storageState in their config
  await page.context().storageState({ path: authFile });
});
