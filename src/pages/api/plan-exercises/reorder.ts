import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { reorderPlanExercisesSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * PATCH /api/plan-exercises/reorder
 *
 * Reorder exercises within a workout plan.
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
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
    const validationResult = reorderPlanExercisesSchema.safeParse(body);

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

    // 3. Call service to reorder exercises
    try {
      const updatedCount = await workoutPlansService.reorderPlanExercises(
        validationResult.data,
        locals.supabase,
        locals.user.id
      );

      // 4. Return success response
      return new Response(
        JSON.stringify({
          data: {
            updated_count: updatedCount,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("Plan not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout plan not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/plan-exercises/reorder:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
