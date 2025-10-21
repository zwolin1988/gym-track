import type { APIRoute } from "astro";
import { exercisesService } from "@/lib/services/exercises.service";
import { getExerciseByIdParamsSchema } from "@/lib/validation/exercises.schema";

export const prerender = false;

/**
 * GET /api/exercises/{id}
 *
 * Retrieve a single exercise by ID with full details.
 *
 * Path parameters:
 * - id (UUID): Exercise ID
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
    const validationResult = getExerciseByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid exercise ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to get exercise
    const exercise = await exercisesService.getExerciseById(id, locals.supabase);

    // 4. Handle not found
    if (!exercise) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Exercise not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return success response
    return new Response(JSON.stringify({ data: exercise }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/exercises/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
