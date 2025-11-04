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
  // 1. Get env vars - different sources for different environments:
  //    - Cloudflare Pages (production): context.locals.runtime.env (from dashboard settings)
  //    - Dev & E2E tests: import.meta.env (from .env files)

  // Define Cloudflare runtime type
  interface CloudflareRuntime {
    env?: {
      SUPABASE_URL?: string;
      SUPABASE_KEY?: string;
      [key: string]: string | undefined;
    };
  }

  interface LocalsWithRuntime {
    runtime?: CloudflareRuntime;
  }

  // Try to get from Cloudflare runtime first (if available)
  const runtime = (context.locals as LocalsWithRuntime).runtime;
  const SUPABASE_URL = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const SUPABASE_KEY = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  // Debug logging for production debugging
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // eslint-disable-next-line no-console
    console.error("[Middleware] Missing Supabase credentials!", {
      hasRuntime: !!runtime,
      hasRuntimeEnv: !!runtime?.env,
      runtimeKeys: runtime?.env ? Object.keys(runtime.env) : [],
      hasImportMetaUrl: !!import.meta.env.SUPABASE_URL,
      hasImportMetaKey: !!import.meta.env.SUPABASE_KEY,
    });
  }

  // 2. Create a Supabase client with cookie handling for SSR
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
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

  // 3. Get the authenticated user from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Make both the authenticated client and user available in context.locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  const pathname = context.url.pathname;

  // 5. Define protected paths (require authentication)
  const protectedPaths = ["/dashboard", "/plans", "/workouts", "/workout-plans", "/history", "/profile"];

  // 6. Define auth paths (login, register - should redirect if already logged in)
  const authPaths = ["/auth/login", "/auth/register"];

  // 7. Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // 8. Check if current path is an auth page
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // 9. Route Protection Logic (US-004)
  if (isProtectedPath && !user) {
    // User is not logged in but trying to access protected route
    // Redirect to login with redirectUrl to return after authentication
    const redirectUrl = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/auth/login?redirect=${redirectUrl}`);
  }

  // 10. Redirect logged-in users away from auth pages
  if (isAuthPath && user) {
    // User is already logged in but trying to access login/register
    // Redirect to dashboard
    return context.redirect("/dashboard");
  }

  return next();
});
