/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains all type definitions for data exchanged between
 * the frontend and backend API. All types are derived from database
 * models defined in src/db/database.types.ts to ensure type safety.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/db/database.types";

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMetadataDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetadataDTO;
}

// ============================================================================
// Categories
// ============================================================================

/**
 * Category DTO - Complete category information
 * Used in: GET /api/categories, GET /api/categories/{id}
 */
export type CategoryDTO = Tables<"categories">;

// ============================================================================
// Exercises
// ============================================================================

/**
 * Simplified category info for nested exercise responses
 */
export type ExerciseCategoryMinimalDTO = Pick<CategoryDTO, "id" | "name" | "slug">;

/**
 * Full category info for detailed exercise responses
 */
export type ExerciseCategoryFullDTO = Pick<CategoryDTO, "id" | "name" | "slug" | "description" | "image_path">;

/**
 * Exercise list item DTO with minimal category info
 * Used in: GET /api/exercises (list)
 */
export type ExerciseListItemDTO = Omit<Tables<"exercises">, "category_id"> & {
  category: ExerciseCategoryMinimalDTO;
};

/**
 * Exercise detail DTO with full category info
 * Used in: GET /api/exercises/{id}
 */
export type ExerciseDetailDTO = Omit<Tables<"exercises">, "category_id"> & {
  category: ExerciseCategoryFullDTO;
};

/**
 * Paginated exercises response
 */
export type ExercisesPaginatedResponseDTO = PaginatedResponseDTO<ExerciseListItemDTO>;

// ============================================================================
// Workout Plans
// ============================================================================

/**
 * Workout plan list item DTO with computed fields
 * Used in: GET /api/workout-plans
 */
export type WorkoutPlanListItemDTO = Omit<Tables<"workout_plans">, "user_id" | "deleted_at"> & {
  exercise_count: number;
  total_sets: number;
};

/**
 * Workout plan detail DTO with nested exercises and sets
 * Used in: GET /api/workout-plans/{id}
 */
export type WorkoutPlanDetailDTO = Omit<Tables<"workout_plans">, "user_id" | "deleted_at"> & {
  exercises: PlanExerciseDTO[];
};

/**
 * Create workout plan command
 * Used in: POST /api/workout-plans
 */
export interface CreateWorkoutPlanCommand {
  name: string;
  description?: string | null;
}

/**
 * Update workout plan command
 * Used in: PATCH /api/workout-plans/{id}
 */
export interface UpdateWorkoutPlanCommand {
  name?: string;
  description?: string | null;
}

/**
 * Paginated workout plans response
 */
export type WorkoutPlansPaginatedResponseDTO = PaginatedResponseDTO<WorkoutPlanListItemDTO>;

// ============================================================================
// Plan Exercises
// ============================================================================

/**
 * Minimal exercise info for plan exercise responses
 */
export type PlanExerciseMinimalDTO = Pick<Tables<"exercises">, "id" | "name" | "image_path" | "difficulty"> & {
  category: {
    name: string;
  };
};

/**
 * Plan exercise DTO with nested exercise details and sets
 * Used in nested responses within WorkoutPlanDetailDTO
 */
export type PlanExerciseDTO = Omit<Tables<"plan_exercises">, "user_id" | "plan_id"> & {
  exercise: PlanExerciseMinimalDTO;
  sets: PlanExerciseSetDTO[];
};

/**
 * Create plan exercise command
 * Used in: POST /api/workout-plans/{planId}/exercises
 */
export interface CreatePlanExerciseCommand {
  exercise_id: string;
  order_index?: number;
}

/**
 * Reorder plan exercises command
 * Used in: PATCH /api/plan-exercises/reorder
 */
export interface ReorderPlanExercisesCommand {
  plan_id: string;
  exercises: {
    id: string;
    order_index: number;
  }[];
}

// ============================================================================
// Plan Exercise Sets
// ============================================================================

/**
 * Plan exercise set DTO
 * Used in nested responses within PlanExerciseDTO
 */
export type PlanExerciseSetDTO = Omit<Tables<"plan_exercise_sets">, "user_id" | "plan_exercise_id">;

/**
 * Create plan exercise set command
 * Used in: POST /api/plan-exercises/{planExerciseId}/sets
 */
export interface CreatePlanExerciseSetCommand {
  reps: number;
  weight?: number | null;
  order_index?: number;
}

/**
 * Update plan exercise set command
 * Used in: PATCH /api/plan-exercise-sets/{id}
 */
export interface UpdatePlanExerciseSetCommand {
  reps?: number;
  weight?: number | null;
}

// ============================================================================
// Workouts
// ============================================================================

/**
 * Workout stats DTO
 * Used in nested responses within workout DTOs
 */
export type WorkoutStatsDTO = Omit<Tables<"workout_stats">, "id" | "user_id" | "workout_id" | "created_at">;

/**
 * Workout list item DTO with stats
 * Used in: GET /api/workouts
 */
export type WorkoutListItemDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
};

/**
 * Workout detail DTO with full nested data
 * Used in: GET /api/workouts/{id}, GET /api/workouts/active
 */
export type WorkoutDetailDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
  exercises: WorkoutExerciseDTO[];
};

/**
 * Create workout command
 * Used in: POST /api/workouts
 */
export interface CreateWorkoutCommand {
  plan_id: string;
}

/**
 * Cancel workout command
 * Used in: PATCH /api/workouts/{id}
 */
export interface CancelWorkoutCommand {
  status: "cancelled";
}

/**
 * Paginated workouts response
 */
export type WorkoutsPaginatedResponseDTO = PaginatedResponseDTO<WorkoutListItemDTO>;

// ============================================================================
// Workout Exercises
// ============================================================================

/**
 * Minimal exercise info for workout exercise responses
 */
export type WorkoutExerciseMinimalDTO = Pick<Tables<"exercises">, "id" | "name" | "image_path"> & {
  category?: {
    name: string;
  };
};

/**
 * Workout exercise DTO with nested exercise details and sets
 * Used in nested responses within WorkoutDetailDTO
 */
export type WorkoutExerciseDTO = Omit<Tables<"workout_exercises">, "user_id" | "workout_id"> & {
  exercise: WorkoutExerciseMinimalDTO;
  sets: WorkoutSetDTO[];
};

/**
 * Create workout set command (for adding extra sets during workout)
 * Used in: POST /api/workout-exercises/{workoutExerciseId}/sets
 */
export interface CreateWorkoutSetCommand {
  planned_reps: number;
  planned_weight?: number | null;
  actual_reps?: number | null;
  actual_weight?: number | null;
  completed?: boolean;
  note?: string | null;
  order_index?: number;
}

// ============================================================================
// Workout Sets
// ============================================================================

/**
 * Workout set DTO
 * Used in nested responses within WorkoutExerciseDTO
 */
export type WorkoutSetDTO = Omit<Tables<"workout_sets">, "user_id" | "workout_exercise_id">;

/**
 * Update workout set command
 * Used in: PATCH /api/workout-sets/{id}
 */
export interface UpdateWorkoutSetCommand {
  actual_reps?: number | null;
  actual_weight?: number | null;
  completed?: boolean;
  note?: string | null;
}

// ============================================================================
// Workout Stats & Analytics
// ============================================================================

/**
 * Individual workout data point for stats visualization
 */
export interface WorkoutStatsDataPointDTO {
  id: string;
  date: string;
  plan_name: string;
  duration_minutes: number;
  total_volume: number;
  total_sets: number;
  total_reps: number;
}

/**
 * Aggregated stats summary
 */
export interface WorkoutStatsSummaryDTO {
  total_workouts: number;
  total_volume: number;
  avg_duration_minutes: number;
  avg_volume_per_workout: number;
}

/**
 * Workout stats aggregate response
 * Used in: GET /api/workouts/stats
 */
export interface WorkoutStatsAggregateDTO {
  period: string;
  start_date: string;
  end_date: string;
  workouts: WorkoutStatsDataPointDTO[];
  summary: WorkoutStatsSummaryDTO;
}

// ============================================================================
// Enums (re-exported from database types for convenience)
// ============================================================================

export type DifficultyLevel = Enums<"difficulty_level">;
export type WorkoutStatus = Enums<"workout_status">;

// ============================================================================
// API Error Response Types
// ============================================================================

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Standard API error response
 */
export interface APIErrorResponse {
  error: string;
  message?: string;
  details?: ValidationErrorDetail[];
  active_workout_id?: string;
}
