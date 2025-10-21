import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Type definition for authenticated Supabase client
// This is used in App.Locals interface
export type TypedSupabaseClient = SupabaseClient<Database>;
