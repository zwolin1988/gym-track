import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { getWorkoutPlansQuerySchema, createWorkoutPlanSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * GET /api/workout-plans
 *
 * Retrieve user's workout plans with optional filtering, sorting, and pagination.
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
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = getWorkoutPlansQuerySchema.safeParse(rawParams);

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

    const { search, sort, order, page, limit } = validationResult.data;

    // 3. Call service to get workout plans
    const result = await workoutPlansService.getWorkoutPlans(
      { search },
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
    console.error("Error in GET /api/workout-plans:", error);
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
 * POST /api/workout-plans
 *
 * Create a new workout plan.
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
    const validationResult = createWorkoutPlanSchema.safeParse(body);

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

    // 3. Call service to create workout plan
    const plan = await workoutPlansService.createWorkoutPlan(validationResult.data, locals.supabase, locals.user.id);

    // 4. Return success response
    return new Response(JSON.stringify({ data: plan }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/workout-plans:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
