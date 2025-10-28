/**
 * Test Utilities
 *
 * Reusable utilities for writing tests:
 * - Custom render function with providers
 * - Mock factories
 * - Test data generators
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Custom render function for components that need providers
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Add any global providers here (e.g., Router, Theme, Auth context)
  // For now, just use standard render
  return render(ui, options);
}

/**
 * Mock Supabase User
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "test-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  } as User;
}

/**
 * Mock Supabase Client
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: createMockUser() }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: createMockUser(), session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: createMockUser(), session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * Wait for async operations (alternative to waitFor when you know the delay)
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock fetch response helper
 */
export function mockFetchResponse(data: unknown, options?: { status?: number; ok?: boolean }) {
  return Promise.resolve({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

/**
 * Generate mock workout plan
 */
export function createMockWorkoutPlan(overrides?: Record<string, unknown>) {
  return {
    id: "plan-123",
    name: "Test Workout Plan",
    description: "Test description",
    created_at: new Date().toISOString(),
    last_used_at: null,
    exercises: [],
    ...overrides,
  };
}

/**
 * Generate mock exercise
 */
export function createMockExercise(overrides?: Record<string, unknown>) {
  return {
    id: "exercise-123",
    name: "Bench Press",
    description: "Chest exercise",
    difficulty: "medium" as const,
    image_path: "/images/bench-press.jpg",
    image_alt: "Bench press exercise",
    created_at: new Date().toISOString(),
    category: {
      id: "cat-123",
      name: "Chest",
      slug: "chest",
    },
    ...overrides,
  };
}

/**
 * Generate mock workout
 */
export function createMockWorkout(overrides?: Record<string, unknown>) {
  return {
    id: "workout-123",
    plan_id: "plan-123",
    plan_name: "Test Workout Plan",
    status: "active" as const,
    started_at: new Date().toISOString(),
    completed_at: null,
    exercises: [],
    ...overrides,
  };
}
