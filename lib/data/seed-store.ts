import { seedData } from "@/data/seed";
import { deriveDataset } from "@/lib/finance/derive";
import type { FinanceDataset, RixzaData } from "@/lib/finance/types";
import type { FinanceStore } from "./store";
import { deleteLocalData, readLocalData, writeLocalData } from "./local-json";

/**
 * Stores the record-level document in `data/dataset.local.json`, falling
 * back to the empty bundled seed. Used in local development.
 */
export class SeedStore implements FinanceStore {
  async getData(): Promise<RixzaData> {
    const local = await readLocalData();
    return local ?? structuredClone(seedData);
  }

  async getDataset(): Promise<FinanceDataset> {
    return deriveDataset(await this.getData());
  }

  async setData(data: RixzaData): Promise<void> {
    await writeLocalData(data);
  }

  async resetData(): Promise<void> {
    await deleteLocalData();
  }
}
