import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create a Supabase client with cookie handling for SSR
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

  // Get the authenticated user from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Make both the authenticated client and user available in context.locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  // Optional: Protect routes (uncomment and modify as needed)
  // const protectedPaths = ['/dashboard', '/workouts', '/plans'];
  // const isProtectedPath = protectedPaths.some(path =>
  //   context.url.pathname.startsWith(path)
  // );
  //
  // if (isProtectedPath && !user) {
  //   return context.redirect('/login');
  // }

  return next();
});
