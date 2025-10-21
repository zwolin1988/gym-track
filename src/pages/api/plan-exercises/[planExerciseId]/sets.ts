import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { planExerciseSetParamsSchema, createPlanExerciseSetSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * POST /api/plan-exercises/{planExerciseId}/sets
 *
 * Add a set to an exercise in a workout plan.
 */
export const POST: APIRoute = async ({ locals, params, request }) => {
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
    const paramsValidation = planExerciseSetParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid plan exercise ID format",
          details: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { planExerciseId } = paramsValidation.data;

    // 3. Parse and validate request body
    const body = await request.json();
    const bodyValidation = createPlanExerciseSetSchema.safeParse(body);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid request body",
          details: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Call service to add set to plan exercise
    try {
      const set = await workoutPlansService.addSetToPlanExercise(
        planExerciseId,
        bodyValidation.data,
        locals.supabase,
        locals.user.id
      );

      // 5. Return success response
      return new Response(JSON.stringify({ data: set }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Plan exercise not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Plan exercise not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/plan-exercises/[planExerciseId]/sets:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
