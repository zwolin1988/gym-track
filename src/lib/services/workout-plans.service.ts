import type { SupabaseClient } from "@/db/supabase.client";
import type {
  WorkoutPlanListItemDTO,
  WorkoutPlanDetailDTO,
  WorkoutPlansPaginatedResponseDTO,
  PaginationMetadataDTO,
  CreateWorkoutPlanCommand,
  UpdateWorkoutPlanCommand,
  PlanExerciseDTO,
  CreatePlanExerciseCommand,
  ReorderPlanExercisesCommand,
  CreatePlanExerciseSetCommand,
  UpdatePlanExerciseSetCommand,
} from "@/types";

interface GetWorkoutPlansFilters {
  search?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

interface SortParams {
  sort: "created_at" | "updated_at" | "name";
  order: "asc" | "desc";
}

/**
 * Service class for workout plans operations
 */
export class WorkoutPlansService {
  /**
   * Get paginated list of workout plans with optional filters
   */
  async getWorkoutPlans(
    filters: GetWorkoutPlansFilters,
    pagination: PaginationParams,
    sortParams: SortParams,
    supabase: SupabaseClient,
    userId: string
  ): Promise<WorkoutPlansPaginatedResponseDTO> {
    let query = supabase
      .from("workout_plans")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null);

    // Apply search filter
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    // Apply sorting
    const ascending = sortParams.order === "asc";
    query = query.order(sortParams.sort, { ascending });

    // Calculate pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch workout plans: ${error.message}`);
    }

    // For each plan, get exercise count and total sets
    const plansWithCounts: WorkoutPlanListItemDTO[] = await Promise.all(
      (data || []).map(async (plan) => {
        // Count exercises
        const { count: exerciseCount } = await supabase
          .from("plan_exercises")
          .select("*", { count: "exact", head: true })
          .eq("plan_id", plan.id);

        // Get plan exercise IDs first
        const { data: planExercises } = await supabase.from("plan_exercises").select("id").eq("plan_id", plan.id);

        const planExerciseIds = planExercises?.map((pe) => pe.id) || [];

        // Count total sets using the IDs
        let totalSets = 0;
        if (planExerciseIds.length > 0) {
          const { count } = await supabase
            .from("plan_exercise_sets")
            .select("*", { count: "exact", head: true })
            .in("plan_exercise_id", planExerciseIds);
          totalSets = count || 0;
        }

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          last_used_at: plan.last_used_at,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          exercise_count: exerciseCount || 0,
          total_sets: totalSets,
        };
      })
    );

    const total = count || 0;
    const total_pages = Math.ceil(total / pagination.limit);

    const paginationMetadata: PaginationMetadataDTO = {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages,
    };

    return {
      data: plansWithCounts,
      pagination: paginationMetadata,
    };
  }

  /**
   * Get single workout plan by ID with exercises and sets
   */
  async getWorkoutPlanById(id: string, supabase: SupabaseClient, userId: string): Promise<WorkoutPlanDetailDTO | null> {
    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (planError || !plan) {
      return null;
    }

    // Get exercises with full details
    const { data: planExercises, error: exercisesError } = await supabase
      .from("plan_exercises")
      .select(
        `
        *,
        exercise:exercises(id, name, image_path, difficulty, category:categories(name))
      `
      )
      .eq("plan_id", id)
      .order("order_index");

    if (exercisesError) {
      throw new Error(`Failed to fetch plan exercises: ${exercisesError.message}`);
    }

    // For each exercise, get sets
    const exercisesWithSets: PlanExerciseDTO[] = await Promise.all(
      (planExercises || []).map(async (pe) => {
        const { data: sets, error: setsError } = await supabase
          .from("plan_exercise_sets")
          .select("*")
          .eq("plan_exercise_id", pe.id)
          .order("order_index");

        if (setsError) {
          throw new Error(`Failed to fetch sets: ${setsError.message}`);
        }

        return {
          id: pe.id,
          exercise_id: pe.exercise_id,
          order_index: pe.order_index,
          created_at: pe.created_at,
          exercise: {
            id: pe.exercise.id,
            name: pe.exercise.name,
            image_path: pe.exercise.image_path,
            difficulty: pe.exercise.difficulty,
            category: {
              name: pe.exercise.category.name,
            },
          },
          sets: (sets || []).map((set) => ({
            id: set.id,
            reps: set.reps,
            weight: set.weight,
            order_index: set.order_index,
            created_at: set.created_at,
          })),
        };
      })
    );

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      last_used_at: plan.last_used_at,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      exercises: exercisesWithSets,
    };
  }

  /**
   * Create new workout plan
   */
  async createWorkoutPlan(command: CreateWorkoutPlanCommand, supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("workout_plans")
      .insert({
        name: command.name,
        description: command.description,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workout plan: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Update workout plan
   */
  async updateWorkoutPlan(id: string, command: UpdateWorkoutPlanCommand, supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("workout_plans")
      .update({
        name: command.name,
        description: command.description,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Delete workout plan (soft delete)
   */
  async deleteWorkoutPlan(id: string, supabase: SupabaseClient, userId: string): Promise<boolean> {
    // Check for active workout
    const { data: activeWorkout } = await supabase
      .from("workouts")
      .select("id")
      .eq("plan_id", id)
      .eq("status", "active")
      .single();

    if (activeWorkout) {
      throw new Error("Cannot delete plan with active workout");
    }

    // Soft delete - must also check that deleted_at IS NULL to avoid updating already deleted plans
    const { data, error } = await supabase
      .from("workout_plans")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    console.log("Delete plan - id:", id, "userId:", userId);
    console.log("Delete plan - data:", data);
    console.log("Delete plan - error:", error);

    if (error || !data) {
      console.error("Failed to delete workout plan. Error:", error, "Data:", data);
      return false;
    }

    return true;
  }

  /**
   * Add exercise to plan
   */
  async addExerciseToPlan(
    planId: string,
    command: CreatePlanExerciseCommand,
    supabase: SupabaseClient,
    userId: string
  ) {
    // Verify plan exists and belongs to user
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Auto-assign order_index if not provided
    let orderIndex = command.order_index;
    if (orderIndex === undefined) {
      const { count } = await supabase
        .from("plan_exercises")
        .select("*", { count: "exact", head: true })
        .eq("plan_id", planId);
      orderIndex = count || 0;
    }

    const { data, error } = await supabase
      .from("plan_exercises")
      .insert({
        plan_id: planId,
        exercise_id: command.exercise_id,
        order_index: orderIndex,
        user_id: userId,
      })
      .select(
        `
        *,
        exercise:exercises(id, name, image_path, difficulty)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to add exercise to plan: ${error.message}`);
    }

    return {
      id: data.id,
      plan_id: data.plan_id,
      exercise_id: data.exercise_id,
      order_index: data.order_index,
      created_at: data.created_at,
      exercise: {
        id: data.exercise.id,
        name: data.exercise.name,
        image_path: data.exercise.image_path,
        difficulty: data.exercise.difficulty,
      },
    };
  }

  /**
   * Reorder plan exercises
   */
  async reorderPlanExercises(
    command: ReorderPlanExercisesCommand,
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    // Verify plan belongs to user
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("id", command.plan_id)
      .eq("user_id", userId)
      .single();

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Update each exercise order_index
    let updatedCount = 0;
    for (const exercise of command.exercises) {
      const { error } = await supabase
        .from("plan_exercises")
        .update({ order_index: exercise.order_index })
        .eq("id", exercise.id)
        .eq("user_id", userId);

      if (!error) {
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Remove exercise from plan
   */
  async removeExerciseFromPlan(id: string, supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { error } = await supabase.from("plan_exercises").delete().eq("id", id).eq("user_id", userId);

    return !error;
  }

  /**
   * Add set to plan exercise
   */
  async addSetToPlanExercise(
    planExerciseId: string,
    command: CreatePlanExerciseSetCommand,
    supabase: SupabaseClient,
    userId: string
  ) {
    // Verify plan exercise belongs to user
    const { data: planExercise } = await supabase
      .from("plan_exercises")
      .select("id")
      .eq("id", planExerciseId)
      .eq("user_id", userId)
      .single();

    if (!planExercise) {
      throw new Error("Plan exercise not found");
    }

    // Auto-assign order_index if not provided
    let orderIndex = command.order_index;
    if (orderIndex === undefined) {
      const { count } = await supabase
        .from("plan_exercise_sets")
        .select("*", { count: "exact", head: true })
        .eq("plan_exercise_id", planExerciseId);
      orderIndex = count || 0;
    }

    const { data, error } = await supabase
      .from("plan_exercise_sets")
      .insert({
        plan_exercise_id: planExerciseId,
        reps: command.reps,
        weight: command.weight,
        order_index: orderIndex,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add set: ${error.message}`);
    }

    return {
      id: data.id,
      plan_exercise_id: data.plan_exercise_id,
      reps: data.reps,
      weight: data.weight,
      order_index: data.order_index,
      created_at: data.created_at,
    };
  }

  /**
   * Update plan exercise set
   */
  async updatePlanExerciseSet(
    id: string,
    command: UpdatePlanExerciseSetCommand,
    supabase: SupabaseClient,
    userId: string
  ) {
    const { data, error } = await supabase
      .from("plan_exercise_sets")
      .update({
        reps: command.reps,
        weight: command.weight,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      plan_exercise_id: data.plan_exercise_id,
      reps: data.reps,
      weight: data.weight,
      order_index: data.order_index,
      created_at: data.created_at,
    };
  }

  /**
   * Delete plan exercise set
   */
  async deletePlanExerciseSet(id: string, supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { error } = await supabase.from("plan_exercise_sets").delete().eq("id", id).eq("user_id", userId);

    return !error;
  }
}

// Export singleton instance
export const workoutPlansService = new WorkoutPlansService();
