import type { FinanceDataset, RixzaData } from "@/lib/finance/types";
import type { FinanceStore } from "./store";

/**
 * Placeholder. The record-level model (RixzaData) needs its own Supabase
 * tables and mappers; the migration in `supabase/migrations` predates it.
 * Until that is built, running with Supabase configured is unsupported —
 * the app uses the local JSON store.
 */
export class SupabaseStore implements FinanceStore {
  async getData(): Promise<RixzaData> {
    throw new Error(
      "SupabaseStore: le modèle par enregistrements n'est pas encore câblé sur Supabase. Utilisez le mode local.",
    );
  }

  async getDataset(): Promise<FinanceDataset> {
    return (await this.getData()) as never;
  }
}
