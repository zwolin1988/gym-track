import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { workoutSetParamsSchema, updateWorkoutSetSchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * PATCH /api/workout-sets/{id}
 *
 * Update a set during a workout (log actual performance).
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
    const paramsValidation = workoutSetParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout set ID format",
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
    const bodyValidation = updateWorkoutSetSchema.safeParse(body);

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

    // 4. Call service to update workout set
    try {
      const workoutSet = await workoutsService.updateWorkoutSet(
        id,
        bodyValidation.data,
        locals.supabase,
        locals.user.id
      );

      // 5. Handle not found
      if (!workoutSet) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout set not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 6. Return success response
      return new Response(JSON.stringify({ data: workoutSet }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle business logic error (workout not active)
      if (error instanceof Error && error.message.includes("not active")) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Cannot update set - workout is not active",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/workout-sets/[id]:", error);
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
 * DELETE /api/workout-sets/{id}
 *
 * Delete a set from a workout.
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
    const paramsValidation = workoutSetParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout set ID format",
          details: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = paramsValidation.data;

    // 3. Call service to delete workout set
    try {
      const result = await workoutsService.deleteWorkoutSet(id, locals.supabase, locals.user.id);

      // 4. Handle not found
      if (!result) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout set not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 5. Return success response
      return new Response(JSON.stringify({ data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle business logic error (workout not active)
      if (error instanceof Error && error.message.includes("not active")) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Cannot delete set - workout is not active",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/workout-sets/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
