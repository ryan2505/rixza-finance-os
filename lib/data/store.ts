/**
 * Data access contract for RIXZA Finance OS.
 *
 * The app operates on a single record-level `RixzaData` document; the
 * aggregated `FinanceDataset` that dashboards render from is derived from
 * it. In dev this document lives in a local JSON file (`SeedStore`); in
 * production it is one JSONB row in Supabase (`SupabaseStore`).
 */

import type { FinanceDataset, RixzaData } from "@/lib/finance/types";

export interface FinanceStore {
  /** The record-level source of truth. */
  getData(): Promise<RixzaData>;
  /** The aggregated dataset dashboards render from (derived from getData). */
  getDataset(): Promise<FinanceDataset>;
  /** Persist a full replacement of the document. */
  setData(data: RixzaData): Promise<void>;
  /** Clear back to the empty seed. */
  resetData(): Promise<void>;
}
