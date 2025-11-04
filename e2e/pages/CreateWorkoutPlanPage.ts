/**
 * Page Object Model - Create Workout Plan Page
 *
 * Implements POM pattern for the workout plan creation wizard (3 steps)
 * Uses data-testid locators for resilient element selection
 */

import type { Page, Locator } from "@playwright/test";

export class CreateWorkoutPlanPage {
  readonly page: Page;

  // Step 1: Basic Info locators
  readonly planNameInput: Locator;
  readonly planDescriptionInput: Locator;

  // Wizard navigation buttons
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly submitButton: Locator;

  // Step 2: Exercise Selection locators
  readonly exerciseSearchInput: Locator;

  // Step 3: Define Sets locators
  readonly addSetButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 - Basic Info
    this.planNameInput = page.getByTestId("plan-name-input");
    this.planDescriptionInput = page.getByTestId("plan-description-input");

    // Wizard navigation
    this.nextButton = page.getByTestId("wizard-button-next");
    this.backButton = page.getByTestId("wizard-button-back");
    this.submitButton = page.getByTestId("wizard-button-submit");

    // Step 2 - Exercise Selection
    this.exerciseSearchInput = page.getByTestId("exercise-search-input");

    // Step 3 - Define Sets
    this.addSetButton = page.getByTestId("add-set-button");
  }

  /**
   * Navigate to the create workout plan page
   */
  async goto() {
    await this.page.goto("/workout-plans/new");
    // Wait for the wizard to load
    await this.planNameInput.waitFor({ state: "visible" });
  }

  /**
   * Step 1: Fill in basic plan information
   */
  async fillBasicInfo(name: string, description?: string) {
    // Clear and focus on name input
    await this.planNameInput.click();
    await this.page.waitForTimeout(100);

    // Type name character by character to trigger React onChange
    await this.planNameInput.pressSequentially(name, { delay: 30 });

    // Wait for React state to update and verify value
    await this.page.waitForTimeout(200);

    if (description) {
      await this.planDescriptionInput.click();
      await this.page.waitForTimeout(100);
      await this.planDescriptionInput.pressSequentially(description, { delay: 30 });
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Step 1: Complete and proceed to Step 2
   */
  async completeStep1(name: string, description?: string) {
    await this.fillBasicInfo(name, description);
    await this.nextButton.click();
    // Wait for Step 2 to load (exercise search should be visible)
    await this.exerciseSearchInput.waitFor({ state: "visible" });
  }

  /**
   * Step 2: Search for an exercise by name
   */
  async searchExercise(searchTerm: string) {
    await this.exerciseSearchInput.fill(searchTerm);
    // Wait for debounce (300ms in ExerciseSearchBar)
    await this.page.waitForTimeout(400);
  }

  /**
   * Step 2: Add an exercise by clicking its "Dodaj" button
   * Uses the exercise name to find the card and click the add button
   * @returns The exercise ID that was added
   */
  async addExerciseByName(exerciseName: string): Promise<string> {
    // Find the exercise card that contains the exercise name
    const exerciseCard = this.page.locator('[data-testid^="exercise-card-"]', {
      hasText: exerciseName,
    });

    // Wait for the card to be visible
    await exerciseCard.waitFor({ state: "visible" });

    // Extract the exercise ID from the data-testid attribute
    const cardTestId = await exerciseCard.getAttribute("data-testid");
    const exerciseId = cardTestId?.replace("exercise-card-", "");

    if (!exerciseId) {
      throw new Error(`Could not find exercise ID for: ${exerciseName}`);
    }

    // Click the add button for this specific exercise
    const addButton = this.page.getByTestId(`exercise-add-button-${exerciseId}`);
    await addButton.click();

    // Wait a moment for the exercise to be added to the list
    await this.page.waitForTimeout(300);

    // Return the exercise ID for use in Step 3
    return exerciseId;
  }

  /**
   * Step 2: Complete and proceed to Step 3
   */
  async completeStep2() {
    await this.nextButton.click();
    // Wait for Step 3 to load (add set button should be visible)
    await this.addSetButton.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Step 3: Fill in reps and weight for a specific set within a specific exercise
   * @param exerciseId - Exercise ID to scope the inputs
   * @param setNumber - Set number (1-based index)
   * @param reps - Number of repetitions
   * @param weight - Weight in kg (optional)
   */
  async fillSetDetails(exerciseId: string, setNumber: number, reps: number, weight?: number) {
    // Scope to the specific exercise card
    const exerciseCard = this.page.getByTestId(`exercise-in-plan-${exerciseId}`);

    // Find set inputs within this exercise card
    const repsInput = exerciseCard.getByTestId(`set-${setNumber}-reps`);
    const weightInput = exerciseCard.getByTestId(`set-${setNumber}-weight`);

    await repsInput.fill(reps.toString());

    if (weight !== undefined) {
      await weightInput.fill(weight.toString());
    }
  }

  /**
   * Step 3: Add a new set by clicking the "Dodaj serię" button for a specific exercise
   * @param exerciseId - Exercise ID to scope the button
   */
  async addNewSet(exerciseId: string) {
    // Scope to the specific exercise card
    const exerciseCard = this.page.getByTestId(`exercise-in-plan-${exerciseId}`);

    // Find the "Dodaj serię" button within this exercise card
    const addSetButton = exerciseCard.getByTestId("add-set-button");

    await addSetButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Step 3: Complete the wizard by submitting the plan
   * Waits for navigation to /workout-plans with success message
   */
  async submitPlan() {
    await this.submitButton.click();

    // Wait for navigation to workout plans list with success message
    // Increased timeout for CI environments which may be slower
    await this.page.waitForURL(/.*workout-plans\?success=/, { timeout: 20000 });
  }

  /**
   * Full flow: Create a workout plan with one exercise and custom sets
   */
  async createPlanWithExercise(
    planName: string,
    exerciseName: string,
    sets: { reps: number; weight?: number }[],
    description?: string
  ) {
    // Step 1: Basic Info
    await this.completeStep1(planName, description);

    // Step 2: Add Exercise and capture its ID
    await this.searchExercise(exerciseName);
    const exerciseId = await this.addExerciseByName(exerciseName);
    await this.completeStep2();

    // Step 3: Define Sets
    // First set is added by default, so we update it
    await this.fillSetDetails(exerciseId, 1, sets[0].reps, sets[0].weight);

    // Add additional sets if needed
    for (let i = 1; i < sets.length; i++) {
      await this.addNewSet(exerciseId);
      await this.fillSetDetails(exerciseId, i + 1, sets[i].reps, sets[i].weight);
    }

    // Submit the plan
    await this.submitPlan();
  }

  /**
   * Verify we're on the correct step by checking visible elements
   */
  async verifyStep(step: 1 | 2 | 3) {
    switch (step) {
      case 1:
        await this.planNameInput.waitFor({ state: "visible" });
        break;
      case 2:
        await this.exerciseSearchInput.waitFor({ state: "visible" });
        break;
      case 3:
        // Use first() since there can be multiple "add set" buttons (one per exercise)
        await this.addSetButton.first().waitFor({ state: "visible" });
        break;
    }
  }

  /**
   * Check if the Next button is enabled
   */
  async isNextButtonEnabled(): Promise<boolean> {
    return !(await this.nextButton.isDisabled());
  }

  /**
   * Check if the Submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return !(await this.submitButton.isDisabled());
  }
}
