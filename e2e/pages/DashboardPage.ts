/**
 * Page Object Model - Dashboard Page
 *
 * Implements POM pattern for Dashboard interactions
 */

import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly createPlanButton: Locator;
  readonly startWorkoutButton: Locator;
  readonly activeWorkoutBanner: Locator;
  readonly userAvatarButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByRole("heading", { name: /witaj|welcome|Szybkie akcje/i });
    this.createPlanButton = page.getByRole("button", { name: /stwórz plan|create plan/i });
    this.startWorkoutButton = page.getByRole("button", { name: /rozpocznij trening|start workout/i });
    this.activeWorkoutBanner = page.getByText(/aktywny trening|active workout/i);
    // Avatar button that triggers the dropdown menu
    // Using text content from AvatarFallback (user initials)
    this.userAvatarButton = page.locator("button.rounded-full").first();
    // Logout button inside the dropdown menu (contains "Wyloguj" text in span)
    this.logoutButton = page.locator('button:has-text("Wyloguj")');
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async isOnDashboard() {
    await this.page.waitForURL("**/dashboard**");
    return this.page.url().includes("/dashboard");
  }

  async hasWelcomeMessage() {
    return this.welcomeMessage.isVisible();
  }

  async logout() {
    // Wait for avatar button to be visible (ensures user is logged in)
    await this.userAvatarButton.waitFor({ state: "visible" });
    // Click avatar to open dropdown menu
    await this.userAvatarButton.click();
    // Wait for logout button to be visible in dropdown, then click
    await this.logoutButton.waitFor({ state: "visible" });
    await this.logoutButton.click();
  }
}
