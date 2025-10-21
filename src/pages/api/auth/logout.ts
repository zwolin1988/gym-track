import type { APIRoute } from "astro";
import { mapSupabaseAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/logout
 * User logout endpoint (US-003)
 *
 * Request body: none
 * Success response (200): { message: string }
 * Error response (500): { error: string }
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // 1. Sign out user from Supabase Auth
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      // Map Supabase error to Polish message
      const { message, statusCode } = mapSupabaseAuthError(error, "logout");

      return new Response(JSON.stringify({ error: message }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Success response
    // Note: Session cookies are automatically removed by @supabase/ssr via middleware
    return new Response(JSON.stringify({ message: "Wylogowano pomyślnie" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas wylogowywania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
