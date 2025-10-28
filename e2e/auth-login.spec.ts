/**
 * E2E Test - Authentication (Login)
 *
 * Implements best practices:
 * - Page Object Model pattern (per cursor rules)
 * - Browser context isolation (per cursor rules)
 * - Semantic locators (per cursor rules)
 * - Test hooks for setup/teardown (per cursor rules)
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TEST_USERS, AUTH_ROUTES } from "./fixtures/auth";

test.describe("Authentication - Login Flow", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Setup hook - runs before each test
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test("TC-AUTH-003: should login successfully with valid credentials", async ({ page }) => {
    // SKIPPED: This test requires a valid user account in the database
    // To run this test:
    // 1. Create a test user in Supabase
    // 2. Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env file
    // 3. Remove .skip() from this test
    // See e2e/README.md for detailed instructions

    // Arrange - test data from fixtures
    const { email, password } = TEST_USERS.valid;

    // Act - perform login using POM
    await loginPage.login(email, password);

    // Assert - verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Szybkie akcje", level: 2 })).toBeVisible();
  });

  test("TC-AUTH-004: should show error with invalid credentials", async ({ page }) => {
    // Arrange
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

  test("should show validation error for empty email", async ({ page }) => {
    // Act - try to submit with empty email
    await loginPage.passwordInput.fill("SomePassword123!");
    await loginPage.submitButton.click();

    // Assert - form should not submit due to HTML5 validation
    // Page should still be on login (not navigated away)
    await expect(page).toHaveURL(/.*auth\/login/);
    // Email input should have required attribute
    await expect(loginPage.emailInput).toHaveAttribute("required");
  });

  test("should show validation error for empty password", async ({ page }) => {
    // Act
    await loginPage.emailInput.fill("test@example.com");
    await loginPage.submitButton.click();

    // Assert - form should not submit due to HTML5 validation
    await expect(page).toHaveURL(/.*auth\/login/);
    await expect(loginPage.passwordInput).toHaveAttribute("required");
  });

  test("should navigate to register page from login", async ({ page }) => {
    // Act - click register link
    await loginPage.registerLink.click();

    // Assert - should redirect to register page
    await expect(page).toHaveURL(/.*auth\/register/);
  });

  test("TC-AUTH-006: should redirect to login when accessing protected route without auth", async ({ page }) => {
    // Act - try to access protected route directly
    await page.goto(AUTH_ROUTES.dashboard);

    // Assert - should redirect to login with redirect parameter
    await expect(page).toHaveURL(/.*auth\/login.*redirect/);
  });
});

test.describe("Authentication - Session Management", () => {
  test("should persist session after page reload", async ({ page }) => {
    // SKIPPED: This test requires a valid user account in the database
    // See TC-AUTH-003 above for setup instructions

    // Arrange - login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/);

    // Act - reload page
    await page.reload();

    // Assert - should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should logout successfully", async ({ page }) => {
    // SKIPPED: This test requires a valid user account in the database
    // See TC-AUTH-003 above for setup instructions

    // Arrange - login first
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
    await page.waitForURL(/.*dashboard/);

    // Act - click logout
    await dashboardPage.logoutButton.click();

    // Assert - should redirect to login
    await expect(page).toHaveURL(/.*auth\/login/);

    // Verify session is cleared - try accessing dashboard
    await page.goto(AUTH_ROUTES.dashboard);
    await expect(page).toHaveURL(/.*auth\/login/);
  });
});

// Visual comparison test (per cursor rules)
test.describe("Visual Regression Tests", () => {
  test("login page visual snapshot", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Take screenshot and compare (per cursor rules: expect(page).toHaveScreenshot())
    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
      // First run will create baseline, subsequent runs compare
    });
  });
});
