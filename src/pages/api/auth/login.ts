import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/validation/auth.schemas";
import { mapSupabaseAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/login
 * User login endpoint (US-002)
 *
 * Request body: { email: string, password: string }
 * Success response (200): { user: { id, email }, message: string }
 * Error response (400/401/500): { error: string }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod schema (Polish error messages)
    const validationResult = loginSchema.safeParse(body);

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

    // 3. Login user with Supabase Auth
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error to Polish message with appropriate status code
      // IMPORTANT: For security, always return generic message for login failures
      const { message, statusCode } = mapSupabaseAuthError(error, "login");

      return new Response(JSON.stringify({ error: message }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Nie udało się zalogować użytkownika" }), {
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
        message: "Zalogowano pomyślnie",
      }),
      {
        status: 200,
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
