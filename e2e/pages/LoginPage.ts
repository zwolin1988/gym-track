/**
 * Page Object Model - Login Page
 *
 * Implements POM pattern (per cursor rules) for maintainable E2E tests
 * Uses locators for resilient element selection (per cursor rules)
 */

import type { Page, Locator } from "@playwright/test";

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
    // First fill the form fields
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Then click and wait for navigation
    // This handles the async login flow with 500ms delay before redirect
    const [response] = await Promise.all([
      this.page.waitForNavigation({ url: /.*dashboard/, timeout: 15000 }),
      this.submitButton.click(),
    ]);

    return response;
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
