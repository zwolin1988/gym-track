import type { APIRoute } from "astro";
import { workoutsService } from "@/lib/services/workouts.service";
import { workoutExerciseParamsSchema, createWorkoutSetSchema } from "@/lib/validation/workouts.schema";

export const prerender = false;

/**
 * POST /api/workout-exercises/{workoutExerciseId}/sets
 *
 * Add an additional set to an exercise during a workout.
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
    const paramsValidation = workoutExerciseParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout exercise ID format",
          details: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { workoutExerciseId } = paramsValidation.data;

    // 3. Parse and validate request body
    const body = await request.json();
    const bodyValidation = createWorkoutSetSchema.safeParse(body);

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

    // 4. Call service to add set to workout exercise
    try {
      const workoutSet = await workoutsService.addSetToWorkoutExercise(
        workoutExerciseId,
        bodyValidation.data,
        locals.supabase,
        locals.user.id
      );

      // 5. Return success response
      return new Response(JSON.stringify({ data: workoutSet }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return new Response(
            JSON.stringify({
              error: "Not Found",
              message: "Workout exercise not found or unauthorized",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (error.message.includes("not active")) {
          return new Response(
            JSON.stringify({
              error: "Bad Request",
              message: "Cannot add set - workout is not active",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/workout-exercises/[workoutExerciseId]/sets:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
