import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { seedData } from "@/data/seed";
import { deriveDataset } from "@/lib/finance/derive";
import type { FinanceDataset, RixzaData } from "@/lib/finance/types";
import type { FinanceStore } from "./store";

const TABLE = "app_data";
const ROW_ID = "rixza";

/**
 * Stores the whole `RixzaData` document as one JSONB row in Supabase.
 * Single-tenant, atomic, and works on a read-only serverless filesystem.
 */
export class SupabaseStore implements FinanceStore {
  async getData(): Promise<RixzaData> {
    const { data, error } = await supabaseAdmin()
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) throw new Error(`SupabaseStore.getData: ${error.message}`);
    if (!data?.data) return structuredClone(seedData);
    return data.data as RixzaData;
  }

  async getDataset(): Promise<FinanceDataset> {
    return deriveDataset(await this.getData());
  }

  async setData(data: RixzaData): Promise<void> {
    const { error } = await supabaseAdmin()
      .from(TABLE)
      .upsert({ id: ROW_ID, data, updated_at: new Date().toISOString() });
    if (error) throw new Error(`SupabaseStore.setData: ${error.message}`);
  }

  async resetData(): Promise<void> {
    await this.setData(structuredClone(seedData));
  }
}
