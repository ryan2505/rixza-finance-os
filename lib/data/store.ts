/**
 * Data access contract for RIXZA Finance OS.
 *
 * The app reads record-level `RixzaData`; the aggregated `FinanceDataset`
 * that dashboards consume is derived from it. Today this is fulfilled by
 * a local JSON file (`LocalStore`); Supabase can take over later.
 */

import type { FinanceDataset, RixzaData } from "@/lib/finance/types";

export interface FinanceStore {
  /** The record-level source of truth. */
  getData(): Promise<RixzaData>;
  /** The aggregated dataset dashboards render from (derived from getData). */
  getDataset(): Promise<FinanceDataset>;
}
