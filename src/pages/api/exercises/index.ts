import type { APIRoute } from "astro";
import { exercisesService } from "@/lib/services/exercises.service";
import { getExercisesQuerySchema } from "@/lib/validation/exercises.schema";

export const prerender = false;

/**
 * GET /api/exercises
 *
 * Retrieve exercises with optional filtering, searching, and pagination.
 *
 * Query parameters:
 * - category_id (UUID, optional): Filter by category ID
 * - difficulty (string[], optional): Filter by difficulty level (comma-separated)
 * - search (string, optional): Search by exercise name
 * - page (number, optional, default: 1): Page number for pagination
 * - limit (number, optional, default: 20, max: 100): Results per page
 */
export const GET: APIRoute = async ({ locals, url }) => {
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

    // 2. Extract and validate query parameters
    const rawParams = {
      category_id: url.searchParams.get("category_id") || undefined,
      difficulty: url.searchParams.get("difficulty") || undefined,
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = getExercisesQuerySchema.safeParse(rawParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid query parameters",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { category_id, difficulty, search, page, limit } = validationResult.data;

    // 3. Call service to get exercises
    const result = await exercisesService.getExercises(
      { category_id, difficulty, search },
      { page, limit },
      locals.supabase
    );

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/exercises:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
