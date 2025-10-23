import type { SupabaseClient } from "@/db/supabase.client";
import type {
  WorkoutListItemDTO,
  WorkoutDetailDTO,
  WorkoutsPaginatedResponseDTO,
  PaginationMetadataDTO,
  CreateWorkoutCommand,
  CancelWorkoutCommand,
  CreateWorkoutSetCommand,
  UpdateWorkoutSetCommand,
  WorkoutStatsAggregateDTO,
} from "@/types";

interface GetWorkoutsFilters {
  status?: "active" | "completed" | "cancelled";
  plan_id?: string;
  start_date?: string;
  end_date?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

interface SortParams {
  sort: "started_at" | "completed_at";
  order: "asc" | "desc";
}

interface GetStatsFilters {
  start_date?: string;
  end_date?: string;
  period: "7d" | "4w" | "3m" | "1y";
  plan_id?: string;
}

/**
 * Service class for workouts operations
 */
export class WorkoutsService {
  /**
   * Get paginated list of workouts with optional filters
   */
  async getWorkouts(
    filters: GetWorkoutsFilters,
    pagination: PaginationParams,
    sortParams: SortParams,
    supabase: SupabaseClient,
    userId: string
  ): Promise<WorkoutsPaginatedResponseDTO> {
    let query = supabase
      .from("workouts")
      .select(
        `
        *,
        workout_plans(name),
        workout_stats(*)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.plan_id) {
      query = query.eq("plan_id", filters.plan_id);
    }

    if (filters.start_date) {
      query = query.gte("started_at", filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte("started_at", filters.end_date);
    }

    // Apply sorting
    const ascending = sortParams.order === "asc";
    query = query.order(sortParams.sort, { ascending });

    // Calculate pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }

    // Transform to DTOs
    const workouts: WorkoutListItemDTO[] = (data || []).map((workout) => {
      // Handle both array and single object from Supabase
      const stats = Array.isArray(workout.workout_stats) ? workout.workout_stats[0] : workout.workout_stats;

      return {
        id: workout.id,
        plan_id: workout.plan_id,
        plan_name: workout.workout_plans?.name || "Unknown Plan",
        status: workout.status,
        started_at: workout.started_at,
        completed_at: workout.completed_at,
        stats: stats
          ? {
              duration_minutes: stats.duration_minutes ?? 0,
              total_exercises: stats.total_exercises ?? 0,
              total_sets: stats.total_sets ?? 0,
              total_reps: stats.total_reps ?? 0,
              max_weight: stats.max_weight ?? 0,
              total_volume: stats.total_volume ?? 0,
            }
          : undefined,
      };
    });

    const total = count || 0;
    const total_pages = Math.ceil(total / pagination.limit);

    const paginationMetadata: PaginationMetadataDTO = {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages,
    };

    return {
      data: workouts,
      pagination: paginationMetadata,
    };
  }

  /**
   * Get active workout for user
   */
  async getActiveWorkout(supabase: SupabaseClient, userId: string): Promise<WorkoutDetailDTO | null> {
    const { data: workout, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_plans(name)
      `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !workout) {
      return null;
    }

    // Get exercises with sets
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select(
        `
        *,
        exercise:exercises(id, name, image_path, category:categories(name))
      `
      )
      .eq("workout_id", workout.id)
      .order("order_index");

    if (exercisesError) {
      throw new Error(`Failed to fetch workout exercises: ${exercisesError.message}`);
    }

    // For each exercise, get sets
    const exercisesWithSets = await Promise.all(
      (workoutExercises || []).map(async (we) => {
        const { data: sets, error: setsError } = await supabase
          .from("workout_sets")
          .select("*")
          .eq("workout_exercise_id", we.id)
          .order("order_index");

        if (setsError) {
          throw new Error(`Failed to fetch sets: ${setsError.message}`);
        }

        return {
          id: we.id,
          exercise_id: we.exercise_id,
          order_index: we.order_index,
          created_at: we.created_at,
          exercise: {
            id: we.exercise.id,
            name: we.exercise.name,
            image_path: we.exercise.image_path,
            category: we.exercise.category ? { name: we.exercise.category.name } : undefined,
          },
          sets: (sets || []).map((set) => ({
            id: set.id,
            planned_reps: set.planned_reps,
            planned_weight: set.planned_weight,
            actual_reps: set.actual_reps,
            actual_weight: set.actual_weight,
            completed: set.completed,
            note: set.note,
            order_index: set.order_index,
            created_at: set.created_at,
          })),
        };
      })
    );

    return {
      id: workout.id,
      plan_id: workout.plan_id,
      plan_name: workout.workout_plans?.name || "Unknown Plan",
      status: workout.status,
      started_at: workout.started_at,
      completed_at: workout.completed_at,
      exercises: exercisesWithSets,
    };
  }

  /**
   * Get single workout by ID with full details
   */
  async getWorkoutById(id: string, supabase: SupabaseClient, userId: string): Promise<WorkoutDetailDTO | null> {
    const { data: workout, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_plans(name),
        workout_stats(*)
      `
      )
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !workout) {
      return null;
    }

    // Get exercises with sets
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select(
        `
        *,
        exercise:exercises(id, name, image_path, category:categories(name))
      `
      )
      .eq("workout_id", id)
      .order("order_index");

    if (exercisesError) {
      throw new Error(`Failed to fetch workout exercises: ${exercisesError.message}`);
    }

    // For each exercise, get sets
    const exercisesWithSets = await Promise.all(
      (workoutExercises || []).map(async (we) => {
        const { data: sets, error: setsError } = await supabase
          .from("workout_sets")
          .select("*")
          .eq("workout_exercise_id", we.id)
          .order("order_index");

        if (setsError) {
          throw new Error(`Failed to fetch sets: ${setsError.message}`);
        }

        return {
          id: we.id,
          exercise_id: we.exercise_id,
          order_index: we.order_index,
          created_at: we.created_at,
          exercise: {
            id: we.exercise.id,
            name: we.exercise.name,
            image_path: we.exercise.image_path,
            category: we.exercise.category ? { name: we.exercise.category.name } : undefined,
          },
          sets: (sets || []).map((set) => ({
            id: set.id,
            planned_reps: set.planned_reps,
            planned_weight: set.planned_weight,
            actual_reps: set.actual_reps,
            actual_weight: set.actual_weight,
            completed: set.completed,
            note: set.note,
            order_index: set.order_index,
            created_at: set.created_at,
          })),
        };
      })
    );

    // Handle both array and single object from Supabase
    const stats = Array.isArray(workout.workout_stats) ? workout.workout_stats[0] : workout.workout_stats;

    return {
      id: workout.id,
      plan_id: workout.plan_id,
      plan_name: workout.workout_plans?.name || "Unknown Plan",
      status: workout.status,
      started_at: workout.started_at,
      completed_at: workout.completed_at,
      stats: stats
        ? {
            duration_minutes: stats.duration_minutes ?? 0,
            total_exercises: stats.total_exercises ?? 0,
            total_sets: stats.total_sets ?? 0,
            total_reps: stats.total_reps ?? 0,
            max_weight: stats.max_weight ?? 0,
            total_volume: stats.total_volume ?? 0,
          }
        : undefined,
      exercises: exercisesWithSets,
    };
  }

  /**
   * Create new workout from plan
   */
  async createWorkout(command: CreateWorkoutCommand, supabase: SupabaseClient, userId: string) {
    // Check for active workout
    const { data: activeWorkout } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (activeWorkout) {
      throw new Error("ACTIVE_WORKOUT_EXISTS:" + activeWorkout.id);
    }

    // Verify plan exists and belongs to user
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("id", command.plan_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Create workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        plan_id: command.plan_id,
        user_id: userId,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (workoutError || !workout) {
      throw new Error(`Failed to create workout: ${workoutError?.message}`);
    }

    // Get plan exercises
    const { data: planExercises, error: planExercisesError } = await supabase
      .from("plan_exercises")
      .select("*")
      .eq("plan_id", command.plan_id)
      .order("order_index");

    if (planExercisesError) {
      throw new Error(`Failed to fetch plan exercises: ${planExercisesError.message}`);
    }

    // Copy exercises to workout
    for (const planExercise of planExercises || []) {
      const { data: workoutExercise, error: weError } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workout.id,
          exercise_id: planExercise.exercise_id,
          order_index: planExercise.order_index,
          user_id: userId,
        })
        .select()
        .single();

      if (weError || !workoutExercise) {
        throw new Error(`Failed to create workout exercise: ${weError?.message}`);
      }

      // Get plan exercise sets
      const { data: planSets, error: planSetsError } = await supabase
        .from("plan_exercise_sets")
        .select("*")
        .eq("plan_exercise_id", planExercise.id)
        .order("order_index");

      if (planSetsError) {
        throw new Error(`Failed to fetch plan sets: ${planSetsError.message}`);
      }

      // Copy sets to workout
      for (const planSet of planSets || []) {
        const { error: setError } = await supabase.from("workout_sets").insert({
          workout_exercise_id: workoutExercise.id,
          planned_reps: planSet.reps,
          planned_weight: planSet.weight,
          actual_reps: null,
          actual_weight: null,
          completed: false,
          order_index: planSet.order_index,
          user_id: userId,
        });

        if (setError) {
          throw new Error(`Failed to create workout set: ${setError.message}`);
        }
      }
    }

    // Return created workout with exercises
    return await this.getWorkoutById(workout.id, supabase, userId);
  }

  /**
   * Complete workout
   */
  async completeWorkout(id: string, supabase: SupabaseClient, userId: string) {
    // Get workout
    const { data: workout, error: getError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (getError || !workout) {
      return null;
    }

    if (workout.status !== "active") {
      throw new Error("Workout is not active");
    }

    // Update workout
    const { data: updatedWorkout, error: updateError } = await supabase
      .from("workouts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !updatedWorkout) {
      throw new Error(`Failed to complete workout: ${updateError?.message}`);
    }

    // Calculate stats manually (in case trigger doesn't exist yet)
    await this.calculateWorkoutStats(id, supabase, userId);

    // Return completed workout with stats
    return await this.getWorkoutById(id, supabase, userId);
  }

  /**
   * Cancel workout
   */
  async cancelWorkout(id: string, command: CancelWorkoutCommand, supabase: SupabaseClient, userId: string) {
    // Get workout
    const { data: workout, error: getError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (getError || !workout) {
      return null;
    }

    if (workout.status !== "active") {
      throw new Error("Workout is not active");
    }

    // Update workout
    const { data: updatedWorkout, error: updateError } = await supabase
      .from("workouts")
      .update({
        status: command.status,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !updatedWorkout) {
      return null;
    }

    return {
      id: updatedWorkout.id,
      status: updatedWorkout.status,
      started_at: updatedWorkout.started_at,
      completed_at: updatedWorkout.completed_at,
    };
  }

  /**
   * Add set to workout exercise
   */
  async addSetToWorkoutExercise(
    workoutExerciseId: string,
    command: CreateWorkoutSetCommand,
    supabase: SupabaseClient,
    userId: string
  ) {
    // Verify workout exercise belongs to user and workout is active
    const { data: workoutExercise } = await supabase
      .from("workout_exercises")
      .select("id, workout_id, workouts!inner(status)")
      .eq("id", workoutExerciseId)
      .eq("user_id", userId)
      .single();

    if (!workoutExercise) {
      throw new Error("Workout exercise not found");
    }

    if (workoutExercise.workouts.status !== "active") {
      throw new Error("Workout is not active");
    }

    // Auto-assign order_index if not provided
    let orderIndex = command.order_index;
    if (orderIndex === undefined) {
      const { count } = await supabase
        .from("workout_sets")
        .select("*", { count: "exact", head: true })
        .eq("workout_exercise_id", workoutExerciseId);
      orderIndex = count || 0;
    }

    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        workout_exercise_id: workoutExerciseId,
        planned_reps: command.planned_reps,
        planned_weight: command.planned_weight,
        actual_reps: command.actual_reps,
        actual_weight: command.actual_weight,
        completed: command.completed,
        note: command.note,
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
      workout_exercise_id: data.workout_exercise_id,
      planned_reps: data.planned_reps,
      planned_weight: data.planned_weight,
      actual_reps: data.actual_reps,
      actual_weight: data.actual_weight,
      completed: data.completed,
      note: data.note,
      order_index: data.order_index,
      created_at: data.created_at,
    };
  }

  /**
   * Update workout set
   */
  async updateWorkoutSet(id: string, command: UpdateWorkoutSetCommand, supabase: SupabaseClient, userId: string) {
    // Verify set belongs to user and workout is active
    const { data: workoutSet } = await supabase
      .from("workout_sets")
      .select("id, workout_exercise_id, workout_exercises!inner(workout_id, workouts!inner(status))")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!workoutSet) {
      return null;
    }

    if (workoutSet.workout_exercises.workouts.status !== "active") {
      throw new Error("Workout is not active");
    }

    const { data, error } = await supabase
      .from("workout_sets")
      .update({
        actual_reps: command.actual_reps,
        actual_weight: command.actual_weight,
        completed: command.completed,
        note: command.note,
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
      workout_exercise_id: data.workout_exercise_id,
      planned_reps: data.planned_reps,
      planned_weight: data.planned_weight,
      actual_reps: data.actual_reps,
      actual_weight: data.actual_weight,
      completed: data.completed,
      note: data.note,
      order_index: data.order_index,
      created_at: data.created_at,
    };
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(
    filters: GetStatsFilters,
    supabase: SupabaseClient,
    userId: string
  ): Promise<WorkoutStatsAggregateDTO> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (filters.period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "4w":
        startDate.setDate(endDate.getDate() - 28);
        break;
      case "3m":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Override with custom dates if provided
    const finalStartDate = filters.start_date || startDate.toISOString();
    const finalEndDate = filters.end_date || endDate.toISOString();

    // Build query
    let query = supabase
      .from("workouts")
      .select(
        `
        id,
        started_at,
        workout_plans(name),
        workout_stats(*)
      `
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("started_at", finalStartDate)
      .lte("started_at", finalEndDate)
      .order("started_at", { ascending: true });

    if (filters.plan_id) {
      query = query.eq("plan_id", filters.plan_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch workout stats: ${error.message}`);
    }

    // Transform to DTOs
    const workouts = (data || []).map((workout) => {
      // Handle both array and single object from Supabase
      const stats = Array.isArray(workout.workout_stats) ? workout.workout_stats[0] : workout.workout_stats;

      return {
        id: workout.id,
        date: workout.started_at.split("T")[0],
        plan_name: workout.workout_plans?.name || "Unknown Plan",
        duration_minutes: stats?.duration_minutes || 0,
        total_volume: stats?.total_volume || 0,
        total_sets: stats?.total_sets || 0,
        total_reps: stats?.total_reps || 0,
      };
    });

    // Calculate summary
    const summary = {
      total_workouts: workouts.length,
      total_volume: workouts.reduce((sum, w) => sum + w.total_volume, 0),
      avg_duration_minutes:
        workouts.length > 0
          ? Math.round(workouts.reduce((sum, w) => sum + w.duration_minutes, 0) / workouts.length)
          : 0,
      avg_volume_per_workout:
        workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.total_volume, 0) / workouts.length) : 0,
    };

    return {
      period: filters.period,
      start_date: finalStartDate.split("T")[0],
      end_date: finalEndDate.split("T")[0],
      workouts,
      summary,
    };
  }

  /**
   * Calculate workout stats (helper method)
   */
  private async calculateWorkoutStats(workoutId: string, supabase: SupabaseClient, userId: string) {
    // Get workout
    const { data: workout } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", userId)
      .single();

    if (!workout || workout.status !== "completed") {
      return;
    }

    // Get all completed sets
    const { data: completedSets } = await supabase
      .from("workout_sets")
      .select("*, workout_exercises!inner(exercise_id)")
      .eq("workout_exercises.workout_id", workoutId)
      .eq("completed", true);

    if (!completedSets || completedSets.length === 0) {
      // No completed sets, create stats with zeros
      await supabase.from("workout_stats").upsert({
        workout_id: workoutId,
        user_id: userId,
        duration_minutes: 0,
        total_exercises: 0,
        total_sets: 0,
        total_reps: 0,
        max_weight: 0,
        total_volume: 0,
      });
      return;
    }

    // Calculate stats
    const durationMinutes = Math.round(
      (new Date(workout.completed_at).getTime() - new Date(workout.started_at).getTime()) / 60000
    );

    const uniqueExercises = new Set(completedSets.map((s) => s.workout_exercises.exercise_id));
    const totalExercises = uniqueExercises.size;

    const totalSets = completedSets.length;
    const totalReps = completedSets.reduce((sum, s) => sum + (s.actual_reps || 0), 0);
    const maxWeight = Math.max(...completedSets.map((s) => s.actual_weight || 0));
    const totalVolume = completedSets.reduce((sum, s) => {
      if (s.actual_weight && s.actual_reps) {
        return sum + s.actual_weight * s.actual_reps;
      }
      return sum;
    }, 0);

    // Upsert stats
    await supabase.from("workout_stats").upsert({
      workout_id: workoutId,
      user_id: userId,
      duration_minutes: durationMinutes,
      total_exercises: totalExercises,
      total_sets: totalSets,
      total_reps: totalReps,
      max_weight: maxWeight,
      total_volume: totalVolume,
    });
  }
}

// Export singleton instance
export const workoutsService = new WorkoutsService();
