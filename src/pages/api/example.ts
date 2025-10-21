import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Access authenticated user
  const userId = locals.user.id;
  const userEmail = locals.user.email;

  // Use authenticated Supabase client
  // RLS automatically filters data by auth.uid()
  const { data, error } = await locals.supabase.from("workout_plans").select("*");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: { id: userId, email: userEmail }, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
