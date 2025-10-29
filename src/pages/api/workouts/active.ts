import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";

export const prerender = false;

/**
 * GET /api/workouts/active
 *
 * Retrieve the user's currently active workout, if any.
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service to get active workout
    const workout = await workoutsService.getActiveWorkout(locals.supabase, locals.user.id);

    // 3. Handle not found (no active workout)
    if (!workout) {
      return new Response(null, { status: 204 });
    }

    // 4. Return success response
    return new Response(JSON.stringify({ data: workout }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/workouts/active:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
