import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { getWorkoutsQuerySchema, createWorkoutSchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * GET /api/workouts
 *
 * Retrieve user's workouts with filtering, sorting, and pagination.
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // 1. Authentication check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Extract and validate query parameters
    const rawParams = {
      status: url.searchParams.get("status") || undefined,
      plan_id: url.searchParams.get("plan_id") || undefined,
      start_date: url.searchParams.get("start_date") || undefined,
      end_date: url.searchParams.get("end_date") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = getWorkoutsQuerySchema.safeParse(rawParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid query parameters",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { status, plan_id, start_date, end_date, sort, order, page, limit } = validationResult.data;

    // 3. Call service to get workouts
    const result = await workoutsService.getWorkouts(
      { status, plan_id, start_date, end_date },
      { page, limit },
      { sort, order },
      locals.supabase,
      locals.user.id
    );

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/workouts:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/workouts
 *
 * Start a new workout from a workout plan.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // 1. Authentication check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = createWorkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid request body",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call service to create workout
    try {
      const workout = await workoutsService.createWorkout(validationResult.data, locals.supabase, locals.user.id);

      // 4. Return success response
      return new Response(JSON.stringify({ data: workout }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle business logic errors
      if (error instanceof Error) {
        if (error.message.startsWith("ACTIVE_WORKOUT_EXISTS:")) {
          const activeWorkoutId = error.message.split(":")[1];
          return new Response(
            JSON.stringify({
              error: "Active workout already exists",
              message: "Please complete or cancel the current workout first",
              active_workout_id: activeWorkoutId,
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }

        if (error.message.includes("Plan not found")) {
          return new Response(
            JSON.stringify({
              error: "Not Found",
              message: "Workout plan not found or unauthorized",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/workouts:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
