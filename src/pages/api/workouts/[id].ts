import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { getWorkoutByIdParamsSchema, cancelWorkoutSchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * GET /api/workouts/{id}
 *
 * Retrieve a single workout with full details.
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

    // 3. Call service to get workout
    const workout = await workoutsService.getWorkoutById(id, locals.supabase, locals.user.id);

    // 4. Handle not found
    if (!workout) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Workout not found",
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
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/workouts/[id]:", error);
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
 * PATCH /api/workouts/{id}
 *
 * Cancel an active workout.
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
    const paramsValidation = getWorkoutByIdParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout ID format",
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
    const bodyValidation = cancelWorkoutSchema.safeParse(body);

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

    // 4. Call service to cancel workout
    try {
      const workout = await workoutsService.cancelWorkout(id, bodyValidation.data, locals.supabase, locals.user.id);

      // 5. Handle not found
      if (!workout) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 6. Return success response
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
            message: "Workout is not active",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/workouts/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
