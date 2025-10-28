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
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByRole("heading", { name: /witaj|welcome|dashboard/i });
    this.createPlanButton = page.getByRole("button", { name: /stwórz plan|create plan/i });
    this.startWorkoutButton = page.getByRole("button", { name: /rozpocznij trening|start workout/i });
    this.activeWorkoutBanner = page.getByText(/aktywny trening|active workout/i);
    this.logoutButton = page.getByRole("button", { name: /wyloguj|logout/i });
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
}
