import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { getWorkoutByIdParamsSchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * POST /api/workouts/{id}/complete
 *
 * Complete an active workout.
 */
export const POST: APIRoute = async ({ locals, params }) => {
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

    // 2. Validate path parameter
    const validationResult = getWorkoutByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to complete workout
    try {
      const workout = await workoutsService.completeWorkout(id, locals.supabase, locals.user.id);

      // 4. Handle not found
      if (!workout) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 5. Return success response
      return new Response(JSON.stringify({ data: workout }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle business logic error (workout not active)
      if (error instanceof Error && error.message.includes("not active")) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Workout is not active (already completed or cancelled)",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/workouts/[id]/complete:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
