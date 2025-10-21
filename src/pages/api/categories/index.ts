import type { APIRoute } from "astro";
import { categoriesService } from "@/lib/services/categories.service";

export const prerender = false;

/**
 * GET /api/categories
 *
 * Retrieve all muscle group categories.
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service to get categories
    const categories = await categoriesService.getCategories(locals.supabase);

    // 3. Return success response
    return new Response(JSON.stringify({ data: categories }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/categories:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
