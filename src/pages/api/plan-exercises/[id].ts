import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { uuidParamsSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * DELETE /api/plan-exercises/{id}
 *
 * Remove an exercise from a workout plan.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
    const validationResult = uuidParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid plan exercise ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to remove exercise from plan
    const deleted = await workoutPlansService.removeExerciseFromPlan(id, locals.supabase, locals.user.id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Plan exercise not found or unauthorized",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Return success response (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/plan-exercises/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
