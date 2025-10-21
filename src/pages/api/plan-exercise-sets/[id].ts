import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { uuidParamsSchema, updatePlanExerciseSetSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * PATCH /api/plan-exercise-sets/{id}
 *
 * Update a set in a workout plan.
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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
    const paramsValidation = uuidParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid plan exercise set ID format",
          details: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = paramsValidation.data;

    // 3. Parse and validate request body
    const body = await request.json();
    const bodyValidation = updatePlanExerciseSetSchema.safeParse(body);

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

    // 4. Call service to update set
    const set = await workoutPlansService.updatePlanExerciseSet(
      id,
      bodyValidation.data,
      locals.supabase,
      locals.user.id
    );

    if (!set) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Plan exercise set not found or unauthorized",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return success response
    return new Response(JSON.stringify({ data: set }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/plan-exercise-sets/[id]:", error);
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
 * DELETE /api/plan-exercise-sets/{id}
 *
 * Remove a set from a workout plan.
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
          message: "Invalid plan exercise set ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to delete set
    const deleted = await workoutPlansService.deletePlanExerciseSet(id, locals.supabase, locals.user.id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Plan exercise set not found or unauthorized",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Return success response (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error in DELETE /api/plan-exercise-sets/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
