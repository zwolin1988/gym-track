import type { APIRoute } from "astro";
import { registerSchema } from "@/lib/validation/auth.schemas";
import { mapSupabaseAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/register
 * User registration endpoint (US-001)
 *
 * Request body: { email: string, password: string }
 * Success response (201): { user: { id, email }, message: string }
 * Error response (400/409/500): { error: string }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod schema (Polish error messages)
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      // Extract first validation error
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];

      return new Response(JSON.stringify({ error: firstError || "Nieprawidłowe dane" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // 3. Register user with Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Map Supabase error to Polish message with appropriate status code
      const { message, statusCode } = mapSupabaseAuthError(error, "register");

      return new Response(JSON.stringify({ error: message }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Nie udało się utworzyć użytkownika" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Success response
    // Note: Session cookies are automatically set by @supabase/ssr via middleware
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: "Konto utworzone pomyślnie",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
