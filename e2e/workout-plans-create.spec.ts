/**
 * E2E Test - Create Workout Plan
 *
 * Tests the complete flow of creating a workout plan through the 3-step wizard:
 * 1. Basic Info (name, description)
 * 2. Select Exercises (search, filter, add)
 * 3. Define Sets (reps, weight)
 *
 * This test uses the chromium project which has authenticated state from setup.
 */

import { test, expect } from "@playwright/test";
import { CreateWorkoutPlanPage } from "./pages/CreateWorkoutPlanPage";
import { TEST_WORKOUT_PLANS, TEST_EXERCISES, TEST_SETS } from "./fixtures/workout-plans";

test.describe("Create Workout Plan", () => {
  let createPlanPage: CreateWorkoutPlanPage;

  test.beforeEach(async ({ page }) => {
    createPlanPage = new CreateWorkoutPlanPage(page);
  });

  test("should create a workout plan successfully (full happy path)", async ({ page }) => {
    // This is the main E2E test following the user scenario:
    // 1. User is logged in (via authenticated state from setup)
    // 2. User navigates to Dashboard
    // 3. User clicks "Plany" in navbar
    // 4. User clicks "Nowy plan"
    // 5. User fills in plan name
    // 6. User clicks "Dalej"
    // 7. User searches and selects exercises
    // 8. User clicks "Dalej"
    // 9. User adds sets (reps + weight)
    // 10. User clicks "Utwórz plan"

    // Step 0: Clear localStorage to prevent stale wizard state from previous tests
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.clear());

    // Step 1: Navigate to Dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Click "Plany" in navbar
    await page.getByTestId("nav-link-plany").click();
    await expect(page).toHaveURL(/.*workout-plans/);

    // Step 3: Click "Nowy plan" button on the workout plans page
    await page.getByTestId("new-workout-plan-button").click();

    // Verify we're on the create plan page
    await expect(page).toHaveURL(/.*workout-plans\/new/);

    // Step 4: Fill in basic info (Step 1 of wizard)
    await createPlanPage.fillBasicInfo(TEST_WORKOUT_PLANS.basic.name, TEST_WORKOUT_PLANS.basic.description);

    // Wait for the Next button to be enabled (React state update)
    await expect(createPlanPage.nextButton).toBeEnabled({ timeout: 5000 });

    // Click Next to go to Step 2
    await createPlanPage.nextButton.click();
    await createPlanPage.verifyStep(2);

    // Step 5: Search and add exercises (Step 2 of wizard)
    // Add "Pompki (Push-ups)" exercise
    await createPlanPage.searchExercise("Pompki");
    const exercise1Id = await createPlanPage.addExerciseByName(TEST_EXERCISES.chest.pushups);

    // Clear search and add another exercise
    await createPlanPage.searchExercise("");
    await createPlanPage.searchExercise("Wyciskanie sztangi");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const exercise2Id = await createPlanPage.addExerciseByName(TEST_EXERCISES.chest.benchPress);

    // Verify we can proceed to Step 3
    expect(await createPlanPage.isNextButtonEnabled()).toBe(true);

    // Click Next to go to Step 3
    await createPlanPage.nextButton.click();
    await createPlanPage.verifyStep(3);

    // Step 6: Define sets for exercises (Step 3 of wizard)
    // The first exercise should have a default set (10 reps, no weight)
    // Update the first set for first exercise (Pompki)
    await createPlanPage.fillSetDetails(exercise1Id, 1, 12, 0); // Bodyweight exercise

    // Add another set for first exercise
    await createPlanPage.addNewSet(exercise1Id);
    await createPlanPage.fillSetDetails(exercise1Id, 2, 10, 0);

    // Add a third set
    await createPlanPage.addNewSet(exercise1Id);
    await createPlanPage.fillSetDetails(exercise1Id, 3, 8, 0);

    // Note: The second exercise also has default sets which we'll leave as-is for this test

    // Verify Submit button is enabled
    expect(await createPlanPage.isSubmitButtonEnabled()).toBe(true);

    // Step 7: Submit the plan
    await createPlanPage.submitButton.click();

    // Wait for redirect to workout plans list with success message
    await page.waitForURL(/.*workout-plans\?success=/, { timeout: 10000 });

    // Verify we're back on the workout plans list
    await expect(page).toHaveURL(/.*workout-plans/);

    // Verify the new plan appears in the workout plans grid
    // Since we don't know the plan ID, we'll locate the card by checking for:
    // 1. A workout plan card element (data-testid pattern)
    // 2. That contains the plan name we just created
    const planCard = page.locator('[data-testid^="workout-plan-card-"]', {
      hasText: TEST_WORKOUT_PLANS.basic.name,
    });
    await expect(planCard).toBeVisible({ timeout: 10000 });

    // Additionally verify it shows the correct exercise count (2 exercises)
    await expect(planCard.getByText(/2 ćwiczeń/i)).toBeVisible();
  });

  test("should validate required fields in Step 1", async () => {
    // Navigate directly to create plan page
    await createPlanPage.goto();

    // Try to proceed without filling in the name
    // The Next button should be disabled
    expect(await createPlanPage.isNextButtonEnabled()).toBe(false);

    // Fill in name with less than 3 characters
    await createPlanPage.planNameInput.fill("ab");

    // Next button should still be disabled
    expect(await createPlanPage.isNextButtonEnabled()).toBe(false);

    // Fill in valid name (3+ characters)
    await createPlanPage.planNameInput.fill("Valid Plan Name");

    // Next button should now be enabled
    expect(await createPlanPage.isNextButtonEnabled()).toBe(true);
  });

  test("should validate at least one exercise selected in Step 2", async () => {
    // Navigate to create plan page and complete Step 1
    await createPlanPage.goto();
    await createPlanPage.completeStep1("Test Plan");

    // Verify we're on Step 2
    await createPlanPage.verifyStep(2);

    // Try to proceed without selecting any exercises
    // The Next button should be disabled
    expect(await createPlanPage.isNextButtonEnabled()).toBe(false);

    // Add an exercise
    await createPlanPage.searchExercise("Pompki");
    await createPlanPage.addExerciseByName(TEST_EXERCISES.chest.pushups);

    // Next button should now be enabled
    expect(await createPlanPage.isNextButtonEnabled()).toBe(true);
  });

  test("should create a plan using the helper method", async ({ page }) => {
    // This test demonstrates using the helper method for quick plan creation
    await createPlanPage.goto();

    await createPlanPage.createPlanWithExercise(
      TEST_WORKOUT_PLANS.minimal.name,
      TEST_EXERCISES.chest.pushups,
      [...TEST_SETS.bodyweight] // Convert readonly array to mutable array
    );

    // Verify success
    await expect(page).toHaveURL(/.*workout-plans/);
    // Use first() to handle multiple plans with same name from previous test runs
    await expect(page.getByText(TEST_WORKOUT_PLANS.minimal.name).first()).toBeVisible();
  });

  test("should handle exercise search and filtering", async ({ page }) => {
    // Navigate to create plan page and complete Step 1
    await createPlanPage.goto();
    await createPlanPage.completeStep1("Search Test Plan");

    // First, verify exercises are loaded
    const exerciseCards = page.locator('[data-testid^="exercise-card-"]');
    await expect(exerciseCards.first()).toBeVisible({ timeout: 5000 });

    // Count initial exercises
    const initialCount = await exerciseCards.count();
    expect(initialCount).toBeGreaterThan(5);

    // Search for a specific exercise by name
    await createPlanPage.searchExercise("Pompki");
    await page.waitForTimeout(500);

    // Should show the push-ups exercise within an exercise card
    const pushUpsCard = exerciseCards.filter({ hasText: TEST_EXERCISES.chest.pushups });
    await expect(pushUpsCard.first()).toBeVisible();

    // Verify filtered count is less
    const filteredCount = await exerciseCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount); // Should be filtered

    // Clear search
    await createPlanPage.searchExercise("");
    await page.waitForTimeout(500);

    // Multiple exercises should be visible again
    const allCount = await exerciseCards.count();
    expect(allCount).toEqual(initialCount); // Should show all exercises when search is clear
  });

  test("should allow adding multiple sets to an exercise", async ({ page }) => {
    await createPlanPage.goto();

    // Complete Step 1
    await createPlanPage.completeStep1("Multiple Sets Test");

    // Complete Step 2 - add one exercise
    await createPlanPage.searchExercise("Pompki");
    const exerciseId = await createPlanPage.addExerciseByName(TEST_EXERCISES.chest.pushups);
    await createPlanPage.completeStep2();

    // Step 3: Add multiple sets
    await createPlanPage.fillSetDetails(exerciseId, 1, 15, 0);

    // Add 4 more sets (total 5 sets)
    for (let i = 2; i <= 5; i++) {
      await createPlanPage.addNewSet(exerciseId);
      await createPlanPage.fillSetDetails(exerciseId, i, 12 - i, 0); // Descending reps: 15, 11, 10, 9, 8
    }

    // Verify all set inputs are visible within this exercise
    const exerciseCard = page.getByTestId(`exercise-in-plan-${exerciseId}`);
    for (let i = 1; i <= 5; i++) {
      await expect(exerciseCard.getByTestId(`set-${i}-reps`)).toBeVisible();
    }

    // Submit the plan
    await createPlanPage.submitPlan();

    // Verify success
    await expect(page).toHaveURL(/.*workout-plans/);
  });

  test("should navigate back and forth between wizard steps", async ({ page }) => {
    await createPlanPage.goto();

    // Step 1: Fill basic info
    await createPlanPage.fillBasicInfo("Navigation Test Plan");
    await createPlanPage.nextButton.click();
    await createPlanPage.verifyStep(2);

    // Go back to Step 1
    await createPlanPage.backButton.click();
    await createPlanPage.verifyStep(1);

    // Verify data is preserved
    await expect(createPlanPage.planNameInput).toHaveValue("Navigation Test Plan");

    // Go forward to Step 2 again
    await createPlanPage.nextButton.click();
    await createPlanPage.verifyStep(2);

    // Add an exercise
    await createPlanPage.searchExercise("Pompki");
    await createPlanPage.addExerciseByName(TEST_EXERCISES.chest.pushups);

    // Go to Step 3
    await createPlanPage.nextButton.click();
    await createPlanPage.verifyStep(3);

    // Go back to Step 2
    await createPlanPage.backButton.click();
    await createPlanPage.verifyStep(2);

    // Verify exercise is still selected (should see "Dodano" button)
    const exerciseCard = page.locator('[data-testid^="exercise-card-"]', {
      hasText: TEST_EXERCISES.chest.pushups,
    });
    await expect(exerciseCard.getByText("Dodano")).toBeVisible();
  });
});
