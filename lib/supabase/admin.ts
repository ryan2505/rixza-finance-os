import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./data-env";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Server-only. Bypasses RLS — used solely to
 * read/write the single `app_data` row.
 */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (!url || !key) {
    throw new Error(
      "Supabase data store not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
