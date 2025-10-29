/**
 * Page Object Model - Login Page
 *
 * Implements POM pattern (per cursor rules) for maintainable E2E tests
 * Uses locators for resilient element selection (per cursor rules)
 */

import { expect, type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use semantic locators (role, label) for resilience
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/hasło|password/i);
    this.submitButton = page.getByRole("button", { name: /zaloguj|login/i });
    // Error message doesn't have role="alert", so we search by text content
    this.errorMessage = page
      .locator("div.text-red-500")
      .filter({ hasText: /nieprawidłowy|invalid|błąd|error/i })
      .first();
    this.registerLink = page.getByRole("link", { name: /zarejestruj|register/i });
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForNavigation(email: string, password: string) {
    // Wait for the form to be fully loaded and interactive
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Focus on email input first
    await this.emailInput.click();
    await this.page.waitForTimeout(100);

    // Type email character by character with delay
    await this.emailInput.pressSequentially(email, { delay: 50 });

    // Verify email was entered
    await expect(this.emailInput).toHaveValue(email);

    // Focus on password input
    await this.passwordInput.click();
    await this.page.waitForTimeout(100);

    // Type password character by character with delay
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Verify password was entered
    await expect(this.passwordInput).toHaveValue(password);

    // Wait a bit for React state to sync
    await this.page.waitForTimeout(300);

    // Click submit button and wait for navigation
    await Promise.all([this.page.waitForURL(/.*dashboard/, { timeout: 15000 }), this.submitButton.click()]);
  }

  async waitForErrorMessage() {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage.textContent();
  }

  async isOnLoginPage() {
    await this.page.waitForURL("**/auth/login**");
    return this.page.url().includes("/auth/login");
  }
}
