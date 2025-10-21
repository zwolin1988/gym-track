import { z } from "zod";

/**
 * Validation schema for GET /api/workout-plans query parameters
 */
export const getWorkoutPlansQuerySchema = z.object({
  search: z.string().min(1, "Search term must not be empty").optional(),
  sort: z.enum(["created_at", "updated_at", "name"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
  limit: z.coerce.number().int().positive().max(100, "Limit must not exceed 100").default(20),
});

/**
 * Validation schema for GET /api/workout-plans/{id} path parameters
 */
export const getWorkoutPlanByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid workout plan ID format"),
});

/**
 * Validation schema for POST /api/workout-plans
 */
export const createWorkoutPlanSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().max(500, "Description max 500 characters").optional().nullable(),
});

/**
 * Validation schema for PATCH /api/workout-plans/{id}
 */
export const updateWorkoutPlanSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().max(500, "Description max 500 characters").optional().nullable(),
});

/**
 * Validation schema for Plan Exercises
 */
export const createPlanExerciseSchema = z.object({
  exercise_id: z.string().uuid("Invalid exercise ID format"),
  order_index: z.number().int().nonnegative("Order index must be non-negative").optional(),
});

/**
 * Validation schema for reordering plan exercises
 */
export const reorderPlanExercisesSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID format"),
  exercises: z.array(
    z.object({
      id: z.string().uuid("Invalid exercise ID format"),
      order_index: z.number().int().nonnegative("Order index must be non-negative"),
    })
  ),
});

/**
 * Validation schema for Plan Exercise Sets
 */
export const createPlanExerciseSetSchema = z.object({
  reps: z.number().int().positive("Reps must be greater than 0"),
  weight: z.number().nonnegative("Weight must be 0 or greater").optional().nullable(),
  order_index: z.number().int().nonnegative("Order index must be non-negative").optional(),
});

/**
 * Validation schema for updating Plan Exercise Sets
 */
export const updatePlanExerciseSetSchema = z.object({
  reps: z.number().int().positive("Reps must be greater than 0").optional(),
  weight: z.number().nonnegative("Weight must be 0 or greater").optional().nullable(),
});

/**
 * Validation schema for path parameters with UUID
 */
export const uuidParamsSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

/**
 * Validation schema for plan-exercise path parameters
 */
export const planExerciseParamsSchema = z.object({
  planId: z.string().uuid("Invalid plan ID format"),
});

/**
 * Validation schema for plan-exercise-set path parameters
 */
export const planExerciseSetParamsSchema = z.object({
  planExerciseId: z.string().uuid("Invalid plan exercise ID format"),
});
