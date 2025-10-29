import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { getWorkoutStatsQuerySchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * GET /api/workouts/stats
 *
 * Get aggregated workout statistics for visualization (e.g., volume chart).
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
      start_date: url.searchParams.get("start_date") || undefined,
      end_date: url.searchParams.get("end_date") || undefined,
      period: url.searchParams.get("period") || undefined,
      plan_id: url.searchParams.get("plan_id") || undefined,
    };

    const validationResult = getWorkoutStatsQuerySchema.safeParse(rawParams);

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

    const { start_date, end_date, period, plan_id } = validationResult.data;

    // 3. Call service to get workout stats
    const result = await workoutsService.getWorkoutStats(
      { start_date, end_date, period, plan_id },
      locals.supabase,
      locals.user.id
    );

    // 4. Return success response
    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/workouts/stats:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
