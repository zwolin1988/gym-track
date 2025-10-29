import type { TypedSupabaseClient } from "@/db/supabase.client";
import type { WorkoutPlanListItemDTO } from "@/types";

interface PlanRawData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  plan_exercises: {
    id: string;
    plan_exercise_sets: {
      id: string;
    }[];
  }[];
}

interface GetWorkoutPlansParams {
  supabase: TypedSupabaseClient;
  search?: string;
  page?: number;
  limit?: number;
}

interface GetWorkoutPlansResult {
  plans: WorkoutPlanListItemDTO[];
  totalPlans: number;
  totalPages: number;
  error?: string;
}

export async function getWorkoutPlans({
  supabase,
  search = "",
  page = 1,
  limit = 20,
}: GetWorkoutPlansParams): Promise<GetWorkoutPlansResult> {
  let query = supabase
    .from("workout_plans")
    .select(
      `
      id,
      name,
      description,
      created_at,
      updated_at,
      last_used_at,
      plan_exercises(
        id,
        plan_exercise_sets(
          id
        )
      )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  // Apply filters
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data: plansRaw, error, count } = await query;

  // Handle errors
  if (error) {
    return {
      plans: [],
      totalPlans: 0,
      totalPages: 0,
      error: "Nie udało się załadować planów treningowych",
    };
  }

  // Transform data
  const plans: WorkoutPlanListItemDTO[] = (plansRaw || []).map((p: PlanRawData) => {
    const exercise_count = p.plan_exercises?.length || 0;
    const total_sets = p.plan_exercises?.reduce((sum, ex) => sum + (ex.plan_exercise_sets?.length || 0), 0) || 0;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      exercise_count,
      total_sets,
      last_used_at: p.last_used_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });

  const totalPlans = count || 0;
  const totalPages = Math.ceil(totalPlans / limit);

  return {
    plans,
    totalPlans,
    totalPages,
  };
}

export async function checkActiveWorkout(supabase: TypedSupabaseClient): Promise<boolean> {
  const { data: activeWorkout } = await supabase.from("workouts").select("id").eq("status", "active").maybeSingle();

  return !!activeWorkout;
}
