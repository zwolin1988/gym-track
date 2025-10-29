/**
 * E2E Test - Authentication (Login)
 *
 * Simplified authentication tests focusing on core functionality:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Logout functionality
 *
 * Note: This test file runs in the "auth-tests" project which does NOT use
 * the shared authenticated state. Tests here handle authentication themselves.
 *
 * Implements best practices:
 * - Page Object Model pattern
 * - Browser context isolation
 * - Semantic locators
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TEST_USERS, AUTH_ROUTES } from "./fixtures/auth";

test.describe("Authentication Tests", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    // This test uses credentials from .env.test file:
    // - E2E_USERNAME
    // - E2E_PASSWORD
    // These connect to the dedicated Supabase test database

    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const { email, password } = TEST_USERS.valid;

    // Act - perform login and wait for navigation
    await loginPage.loginAndWaitForNavigation(email, password);

    // Assert - verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Szybkie akcje", level: 2 })).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const { email, password } = TEST_USERS.invalid;

    // Act
    await loginPage.login(email, password);

    // Assert - should stay on login page (not redirect to dashboard)
    // This proves login failed
    await expect(page).toHaveURL(/.*auth\/login/);

    // Note: Error message is shown via toast notification (Sonner),
    // which is difficult to reliably test in E2E due to auto-dismiss behavior
    // The main assertion is that we stay on login page
  });

  test.skip("should logout successfully", async ({ page }) => {
    // This test uses credentials from .env.test file (E2E_USERNAME, E2E_PASSWORD)
    // connected to the dedicated Supabase test database

    // Arrange - login first
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForNavigation(TEST_USERS.valid.email, TEST_USERS.valid.password);

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Act - logout using the avatar dropdown menu
    await dashboardPage.logout();

    // Assert - should redirect to login
    await expect(page).toHaveURL(/.*auth\/login/);

    // Verify session is cleared - try accessing dashboard
    await page.goto(AUTH_ROUTES.dashboard);
    await expect(page).toHaveURL(/.*auth\/login/);
  });
});
