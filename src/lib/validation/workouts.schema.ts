import { z } from "zod";

// ============================================================================
// Query Parameters Schemas
// ============================================================================

/**
 * Schema for GET /api/workouts query parameters
 */
export const getWorkoutsQuerySchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  plan_id: z.string().uuid("Invalid plan ID format").optional(),
  start_date: z.string().datetime("Invalid start date format").optional(),
  end_date: z.string().datetime("Invalid end date format").optional(),
  sort: z.enum(["started_at", "completed_at"]).default("started_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
  limit: z.coerce.number().int().positive().max(100, "Limit must not exceed 100").default(20),
});

/**
 * Schema for GET /api/workouts/stats query parameters
 */
export const getWorkoutStatsQuerySchema = z.object({
  start_date: z.string().datetime("Invalid start date format").optional(),
  end_date: z.string().datetime("Invalid end date format").optional(),
  period: z.enum(["7d", "4w", "3m", "1y"]).default("4w"),
  plan_id: z.string().uuid("Invalid plan ID format").optional(),
});

// ============================================================================
// Path Parameters Schemas
// ============================================================================

/**
 * Schema for workout ID path parameter
 */
export const getWorkoutByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid workout ID format"),
});

/**
 * Schema for workout exercise ID path parameter
 */
export const workoutExerciseParamsSchema = z.object({
  workoutExerciseId: z.string().uuid("Invalid workout exercise ID format"),
});

/**
 * Schema for workout set ID path parameter
 */
export const workoutSetParamsSchema = z.object({
  id: z.string().uuid("Invalid workout set ID format"),
});

// ============================================================================
// Request Body Schemas
// ============================================================================

/**
 * Schema for POST /api/workouts (create workout)
 */
export const createWorkoutSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID format"),
});

/**
 * Schema for PATCH /api/workouts/{id} (cancel workout)
 */
export const cancelWorkoutSchema = z.object({
  status: z.literal("cancelled", {
    errorMap: () => ({ message: "Status must be 'cancelled'" }),
  }),
});

/**
 * Schema for POST /api/workout-exercises/{workoutExerciseId}/sets
 */
export const createWorkoutSetSchema = z.object({
  planned_reps: z.number().int().positive("Planned reps must be greater than 0"),
  planned_weight: z.number().nonnegative("Planned weight must be 0 or greater").optional().nullable(),
  actual_reps: z.number().int().positive("Actual reps must be greater than 0").optional().nullable(),
  actual_weight: z.number().nonnegative("Actual weight must be 0 or greater").optional().nullable(),
  completed: z.boolean().default(false),
  note: z.string().max(200, "Note must not exceed 200 characters").optional().nullable(),
  order_index: z.number().int().nonnegative("Order index must be non-negative").optional(),
});

/**
 * Schema for PATCH /api/workout-sets/{id}
 */
export const updateWorkoutSetSchema = z.object({
  actual_reps: z.number().int().positive("Actual reps must be greater than 0").optional().nullable(),
  actual_weight: z.number().nonnegative("Actual weight must be 0 or greater").optional().nullable(),
  completed: z.boolean().optional(),
  note: z.string().max(200, "Note must not exceed 200 characters").optional().nullable(),
});
