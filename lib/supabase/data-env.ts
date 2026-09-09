/**
 * Config for the Supabase-backed *data* store (not auth — auth is always
 * the local signed cookie). The server reads/writes one JSONB row with the
 * service-role key, so nothing Supabase reaches the browser.
 */

export function supabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    undefined
  );
}

export function supabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export const supabaseDataConfigured =
  !!supabaseUrl() && !!supabaseServiceKey();
