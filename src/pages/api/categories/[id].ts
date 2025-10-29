import type { APIRoute } from "astro";
import { categoriesService } from "@/lib/services/categories.service";
import { getCategoryByIdParamsSchema } from "@/lib/validation/categories.schema";

export const prerender = false;

/**
 * GET /api/categories/{id}
 *
 * Retrieve a single category by ID.
 *
 * Path parameters:
 * - id (UUID): Category ID
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
    const validationResult = getCategoryByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid category ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to get category
    const category = await categoriesService.getCategoryById(id, locals.supabase);

    // 4. Handle not found
    if (!category) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Category not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return success response
    return new Response(JSON.stringify({ data: category }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/categories/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
