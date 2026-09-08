import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { RixzaData } from "@/lib/finance/types";

/** Where the record-level data is persisted in seed mode (gitignored). */
export const LOCAL_DATASET_PATH = path.join(process.cwd(), "data", "dataset.local.json");

export async function readLocalData(): Promise<RixzaData | null> {
  try {
    const raw = await fs.readFile(LOCAL_DATASET_PATH, "utf8");
    return JSON.parse(raw) as RixzaData;
  } catch {
    return null;
  }
}

export async function writeLocalData(data: RixzaData): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_DATASET_PATH), { recursive: true });
  await fs.writeFile(LOCAL_DATASET_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function deleteLocalData(): Promise<void> {
  await fs.rm(LOCAL_DATASET_PATH, { force: true });
}
