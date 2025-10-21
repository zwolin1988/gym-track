import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

/**
 * Astro Middleware for Authentication and Route Protection
 *
 * Responsibilities:
 * - Create Supabase client with cookie handling for SSR (US-001, US-002, US-003)
 * - Get authenticated user from Supabase Auth
 * - Inject supabase client and user into context.locals
 * - Protect authenticated routes (US-004)
 * - Redirect logged-in users away from auth pages
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Create a Supabase client with cookie handling for SSR
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get: (key) => context.cookies.get(key)?.value,
      set: (key, value, options) => {
        context.cookies.set(key, value, options);
      },
      remove: (key, options) => {
        context.cookies.delete(key, options);
      },
    },
  });

  // 2. Get the authenticated user from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Make both the authenticated client and user available in context.locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  const pathname = context.url.pathname;

  // 4. Define protected paths (require authentication)
  const protectedPaths = ["/dashboard", "/plans", "/workouts", "/history", "/profile"];

  // 5. Define auth paths (login, register - should redirect if already logged in)
  const authPaths = ["/auth/login", "/auth/register"];

  // 6. Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // 7. Check if current path is an auth page
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // 8. Route Protection Logic (US-004)
  if (isProtectedPath && !user) {
    // User is not logged in but trying to access protected route
    // Redirect to login with redirectUrl to return after authentication
    const redirectUrl = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/auth/login?redirect=${redirectUrl}`);
  }

  // 9. Redirect logged-in users away from auth pages
  if (isAuthPath && user) {
    // User is already logged in but trying to access login/register
    // Redirect to dashboard
    return context.redirect("/dashboard");
  }

  return next();
});
