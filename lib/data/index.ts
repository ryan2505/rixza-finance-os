import "server-only";

import { SeedStore } from "./seed-store";
import type { FinanceStore } from "./store";

let store: FinanceStore | null = null;

/**
 * The active data store.
 *
 * The record-level model (RixzaData) currently persists to a local JSON
 * file only; the Supabase mapping predates it and is not wired yet. Auth
 * can still use Supabase independently (see proxy.ts).
 *
 * Server-only: touches `next/headers` and the filesystem.
 */
export function getStore(): FinanceStore {
  if (!store) store = new SeedStore();
  return store;
}

export { SeedStore } from "./seed-store";
export type { FinanceStore } from "./store";
