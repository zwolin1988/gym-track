/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { TypedSupabaseClient } from "./db/supabase.client";

declare namespace App {
  interface Locals {
    supabase: TypedSupabaseClient;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
