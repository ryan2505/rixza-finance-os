import "server-only";

import { supabaseDataConfigured } from "@/lib/supabase/data-env";
import { SeedStore } from "./seed-store";
import { SupabaseStore } from "./supabase-store";
import type { FinanceStore } from "./store";

let store: FinanceStore | null = null;

/**
 * The active data store.
 *
 * - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set → `SupabaseStore`
 *   (one JSONB row; required for any serverless / Vercel deployment).
 * - otherwise → `SeedStore` (local JSON file, for `npm run dev`).
 *
 * Server-only: touches secrets and, in dev, the filesystem.
 */
export function getStore(): FinanceStore {
  if (!store) {
    store = supabaseDataConfigured ? new SupabaseStore() : new SeedStore();
  }
  return store;
}

export type { FinanceStore } from "./store";
