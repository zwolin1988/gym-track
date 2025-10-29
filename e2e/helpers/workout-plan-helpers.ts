/**
 * E2E Test Helpers - Workout Plans
 *
 * Helper functions for workout plan E2E tests
 * Includes cleanup utilities and API interaction helpers
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

/**
 * Create a Supabase client for test cleanup
 * Note: This uses the service role key from .env.test
 */
export function getTestSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in .env.test");
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Delete all workout plans created by E2E tests for a specific user
 * This is useful for cleanup after tests
 *
 * @param userId - The user ID whose test plans should be deleted
 * @param planNamePattern - Optional pattern to match plan names (e.g., "E2E Test%")
 */
export async function deleteTestWorkoutPlans(userId: string, planNamePattern = "E2E%") {
  const supabase = getTestSupabaseClient();

  // Delete all workout plans matching the pattern for this user
  const { error } = await supabase.from("workout_plans").delete().eq("user_id", userId).like("name", planNamePattern);

  if (error) {
    console.error("Error deleting test workout plans:", error);
    throw error;
  }
}

/**
 * Get all workout plans for a user
 * Useful for verifying plan creation in tests
 */
export async function getUserWorkoutPlans(userId: string) {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user workout plans:", error);
    throw error;
  }

  return data;
}

/**
 * Get a specific workout plan by name
 * Useful for verifying plan creation with specific name
 */
export async function getWorkoutPlanByName(userId: string, planName: string) {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      `
      *,
      exercises:plan_exercises(
        *,
        exercise:exercises(*),
        sets:plan_exercise_sets(*)
      )
    `
    )
    .eq("user_id", userId)
    .eq("name", planName)
    .single();

  if (error) {
    console.error("Error fetching workout plan by name:", error);
    return null;
  }

  return data;
}

/**
 * Verify that a workout plan exists in the database
 */
export async function verifyWorkoutPlanExists(userId: string, planName: string): Promise<boolean> {
  const plan = await getWorkoutPlanByName(userId, planName);
  return plan !== null;
}

/**
 * Count workout plans for a user matching a pattern
 */
export async function countUserWorkoutPlans(userId: string, namePattern?: string) {
  const supabase = getTestSupabaseClient();

  let query = supabase.from("workout_plans").select("id", { count: "exact", head: true }).eq("user_id", userId);

  if (namePattern) {
    query = query.like("name", namePattern);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error counting user workout plans:", error);
    throw error;
  }

  return count || 0;
}

/**
 * Get exercise ID by name (for test setup)
 */
export async function getExerciseIdByName(exerciseName: string): Promise<string | null> {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase.from("exercises").select("id").eq("name", exerciseName).single();

  if (error) {
    console.error(`Error fetching exercise ID for "${exerciseName}":`, error);
    return null;
  }

  return data?.id || null;
}
