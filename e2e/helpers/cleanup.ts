/**
 * E2E Test Cleanup Utilities
 *
 * This module provides functions to clean up test data from the database
 * after E2E tests complete. It ensures the test database stays clean by
 * removing only data created by the test user.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Creates an authenticated Supabase client for test cleanup operations
 * Logs in as the test user to respect RLS policies
 */
async function getAuthenticatedSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_KEY?.trim();
  const testEmail = process.env.E2E_USERNAME?.trim();
  const testPassword = process.env.E2E_PASSWORD?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in environment");
  }

  if (!testEmail || !testPassword) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in environment");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Sign in as test user to respect RLS policies
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    throw new Error(`Failed to authenticate test user for cleanup: ${signInError.message}`);
  }

  return supabase;
}

/**
 * Cleans up all test data created by the test user
 *
 * IMPORTANT: Only deletes data for the test user (authenticated via E2E_USERNAME).
 * Does NOT delete shared data like categories and exercises.
 *
 * Deletion order (from most dependent to least):
 * 1. plan_exercise_sets (depends on plan_exercises)
 * 2. plan_exercises (depends on workout_plans)
 * 3. workout_sets (depends on workout_exercises)
 * 4. workout_stats (depends on workouts)
 * 5. workout_exercises (depends on workouts)
 * 6. workouts (depends on workout_plans)
 * 7. workout_plans (main table)
 */
export async function cleanupTestData() {
  const supabase = await getAuthenticatedSupabaseClient();
  const testUserId = process.env.E2E_USERNAME_ID?.trim();
  const testEmail = process.env.E2E_USERNAME?.trim();

  if (!testUserId) {
    throw new Error("E2E_USERNAME_ID must be set in environment");
  }

  // Safety check: ensure we're only cleaning up test user data
  if (!testEmail || !testEmail.includes("test")) {
    throw new Error(
      `Safety check failed: E2E_USERNAME (${testEmail}) does not appear to be a test account. ` +
        `Cleanup aborted to prevent accidental deletion of production data.`
    );
  }

  console.log("🧹 Cleaning up test data for user:", testUserId);

  try {
    // 1. Delete plan_exercise_sets (most dependent)
    const { error: setsError } = await supabase.from("plan_exercise_sets").delete().eq("user_id", testUserId);

    if (setsError) {
      console.error("❌ Error deleting plan_exercise_sets:", setsError);
    } else {
      console.log("✓ Deleted plan_exercise_sets");
    }

    // 2. Delete plan_exercises
    const { error: planExercisesError } = await supabase.from("plan_exercises").delete().eq("user_id", testUserId);

    if (planExercisesError) {
      console.error("❌ Error deleting plan_exercises:", planExercisesError);
    } else {
      console.log("✓ Deleted plan_exercises");
    }

    // 3. Delete workout_sets
    const { error: workoutSetsError } = await supabase.from("workout_sets").delete().eq("user_id", testUserId);

    if (workoutSetsError) {
      console.error("❌ Error deleting workout_sets:", workoutSetsError);
    } else {
      console.log("✓ Deleted workout_sets");
    }

    // 4. Delete workout_stats
    const { error: workoutStatsError } = await supabase.from("workout_stats").delete().eq("user_id", testUserId);

    if (workoutStatsError) {
      console.error("❌ Error deleting workout_stats:", workoutStatsError);
    } else {
      console.log("✓ Deleted workout_stats");
    }

    // 5. Delete workout_exercises
    const { error: workoutExercisesError } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("user_id", testUserId);

    if (workoutExercisesError) {
      console.error("❌ Error deleting workout_exercises:", workoutExercisesError);
    } else {
      console.log("✓ Deleted workout_exercises");
    }

    // 6. Delete workouts
    const { error: workoutsError } = await supabase.from("workouts").delete().eq("user_id", testUserId);

    if (workoutsError) {
      console.error("❌ Error deleting workouts:", workoutsError);
    } else {
      console.log("✓ Deleted workouts");
    }

    // 7. Delete workout_plans (main table, least dependent)
    const { error: plansError } = await supabase.from("workout_plans").delete().eq("user_id", testUserId);

    if (plansError) {
      console.error("❌ Error deleting workout_plans:", plansError);
    } else {
      console.log("✓ Deleted workout_plans");
    }

    console.log("✅ Test data cleanup completed");
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
    throw error;
  }
}

/**
 * Cleans up a specific workout plan and all its related data
 *
 * @param planId - The ID of the workout plan to delete
 */
export async function cleanupWorkoutPlan(planId: string) {
  const supabase = await getAuthenticatedSupabaseClient();
  const testUserId = process.env.E2E_USERNAME_ID?.trim();

  if (!testUserId) {
    throw new Error("E2E_USERNAME_ID must be set in environment");
  }

  console.log("🧹 Cleaning up workout plan:", planId);

  try {
    // First, get all plan_exercise IDs for this plan
    const { data: planExercises } = await supabase
      .from("plan_exercises")
      .select("id")
      .eq("plan_id", planId)
      .eq("user_id", testUserId);

    // Delete in correct order (most dependent first)
    if (planExercises && planExercises.length > 0) {
      const exerciseIds = planExercises.map((pe) => pe.id);

      await supabase.from("plan_exercise_sets").delete().in("plan_exercise_id", exerciseIds).eq("user_id", testUserId);
    }

    await supabase.from("plan_exercises").delete().eq("plan_id", planId).eq("user_id", testUserId);

    await supabase.from("workout_plans").delete().eq("id", planId).eq("user_id", testUserId);

    console.log("✅ Workout plan cleanup completed");
  } catch (error) {
    console.error("❌ Error during workout plan cleanup:", error);
    throw error;
  }
}
