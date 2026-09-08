import { seedData } from "@/data/seed";
import { deriveDataset } from "@/lib/finance/derive";
import type { FinanceDataset, RixzaData } from "@/lib/finance/types";
import type { FinanceStore } from "./store";
import { readLocalData } from "./local-json";

/**
 * Serves the record-level data provided through the app (persisted to
 * `data/dataset.local.json`), falling back to the empty bundled seed.
 * Active until Supabase is configured.
 */
export class SeedStore implements FinanceStore {
  async getData(): Promise<RixzaData> {
    const local = await readLocalData();
    return local ?? structuredClone(seedData);
  }

  async getDataset(): Promise<FinanceDataset> {
    return deriveDataset(await this.getData());
  }
}
