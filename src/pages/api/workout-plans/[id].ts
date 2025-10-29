import type { APIRoute } from "astro";
import { workoutPlansService } from "@/lib/services/workout-plans.service";
import { getWorkoutPlanByIdParamsSchema, updateWorkoutPlanSchema } from "@/lib/validation/workout-plans.schema";

export const prerender = false;

/**
 * GET /api/workout-plans/{id}
 *
 * Retrieve a single workout plan with full details including exercises and sets.
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
    const validationResult = getWorkoutPlanByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout plan ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to get workout plan
    const plan = await workoutPlansService.getWorkoutPlanById(id, locals.supabase, locals.user.id);

    // 4. Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Workout plan not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return success response
    return new Response(JSON.stringify({ data: plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/workout-plans/[id]:", error);
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
 * PATCH /api/workout-plans/{id}
 *
 * Update an existing workout plan's name and/or description.
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
    const paramsValidation = getWorkoutPlanByIdParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout plan ID format",
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
    const bodyValidation = updateWorkoutPlanSchema.safeParse(body);

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

    // 4. Call service to update workout plan
    const plan = await workoutPlansService.updateWorkoutPlan(id, bodyValidation.data, locals.supabase, locals.user.id);

    // 5. Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Workout plan not found or unauthorized",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Return success response
    return new Response(JSON.stringify({ data: plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/workout-plans/[id]:", error);
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
 * DELETE /api/workout-plans/{id}
 *
 * Delete a workout plan (soft delete).
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
    const validationResult = getWorkoutPlanByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid workout plan ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;

    // 3. Call service to delete workout plan
    try {
      // eslint-disable-next-line no-console
      console.log("DELETE endpoint - planId:", id, "userId:", locals.user.id);
      const deleted = await workoutPlansService.deleteWorkoutPlan(id, locals.supabase, locals.user.id);
      // eslint-disable-next-line no-console
      console.log("DELETE endpoint - deleted result:", deleted);

      if (!deleted) {
        // eslint-disable-next-line no-console
        console.log("DELETE endpoint - returning 404 because deleted is false");
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Workout plan not found or unauthorized",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 4. Return success response (204 No Content)
      return new Response(null, { status: 204 });
    } catch (error) {
      // Handle business logic error (active workout)
      if (error instanceof Error && error.message.includes("active workout")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Cannot delete plan with active workout",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/workout-plans/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
