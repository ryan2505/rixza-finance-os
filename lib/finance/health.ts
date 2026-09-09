/**
 * RIXZA Financial Health Score (master prompt §35).
 * A 0–100 executive metric built from nine weighted components. It never
 * hides the underlying metrics — every component is returned with its own
 * score and a short note.
 */

import type { CommandCenterSnapshot } from "./snapshot";
import type { FinanceDataset } from "./types";
import { pctChange } from "./metrics";
import {
  MARGIN_CORE_HIGH_PCT,
  MARGIN_CORE_LOW_PCT,
  MARGIN_FLOOR_PCT,
  MARGIN_REJECT_PCT,
} from "./catalogue";

export type HealthStatus = "Solide" | "Correct" | "Fragile" | "Critique";

export interface HealthComponent {
  label: string;
  score: number; // 0–100
  weight: number;
  note: string;
}

export interface HealthScore {
  score: number; // 0–100
  status: HealthStatus;
  components: HealthComponent[];
}

/** Linear map of `value` in [lo, hi] to [0, 100], clamped. */
function scale(value: number, lo: number, hi: number): number {
  if (hi === lo) return 50;
  const t = (value - lo) / (hi - lo);
  return Math.max(0, Math.min(100, Math.round(t * 100)));
}

export function buildHealthScore(
  snapshot: CommandCenterSnapshot,
  dataset: FinanceDataset,
): HealthScore | null {
  const s = snapshot;

  const anyActivity =
    s.revenue.mtd.value !== 0 ||
    s.recurring.endingMrr.value !== 0 ||
    s.cash.balance !== 0;
  if (!anyActivity) return null;

  const months = dataset.months;
  const last = months[months.length - 1];
  const totalExpenses = last.cogs + last.operatingExpenses + last.taxesAndOther;

  // 1. Croissance du CA
  const revGrowth = s.revenue.mtd.changePct ?? 0;
  const c1: HealthComponent = {
    label: "Croissance du CA",
    weight: 15,
    score: scale(revGrowth, -10, 15),
    note: `${revGrowth.toFixed(1)} % vs mois précédent`,
  };

  // 2. Croissance du MRR
  const mrrGrowth = s.recurring.endingMrr.changePct ?? 0;
  const c2: HealthComponent = {
    label: "Croissance du MRR",
    weight: 15,
    score: scale(mrrGrowth, -8, 12),
    note: `${mrrGrowth.toFixed(1)} % vs mois précédent`,
  };

  // 3. Rentabilité — marge BRUTE contre les seuils RIXZA (Pricing Engine §4/§19/§21)
  const grossMargin = s.profitability.grossMargin ?? 0;
  const netMargin = s.profitability.netMargin ?? 0;
  const c3: HealthComponent = {
    label: "Rentabilité (marge brute)",
    weight: 20,
    // < 45 % → 0 ; 50 % (plancher) → 50 ; 65 % (haut du cœur) → 100
    score: scale(grossMargin, MARGIN_REJECT_PCT, MARGIN_CORE_HIGH_PCT + 3),
    note: `marge brute ${grossMargin.toFixed(1)} % · plancher ${MARGIN_FLOOR_PCT} %, cœur ${MARGIN_CORE_LOW_PCT}–${MARGIN_CORE_HIGH_PCT} % (marge nette ${netMargin.toFixed(1)} %)`,
  };

  // 4. Trésorerie (mois de charges couverts)
  const monthsCovered = totalExpenses > 0 ? s.cash.balance / totalExpenses : 12;
  const c4: HealthComponent = {
    label: "Trésorerie",
    weight: 10,
    score: scale(monthsCovered, 1, 12),
    note: `${monthsCovered.toFixed(1)} mois de charges couverts`,
  };

  // 5. Autonomie (runway)
  const runway = s.cash.runwayMonths;
  const c5: HealthComponent = {
    label: "Autonomie",
    weight: 10,
    score: runway === null ? 100 : scale(runway, 3, 12),
    note: runway === null ? "pas de consommation de trésorerie" : `${runway.toFixed(1)} mois`,
  };

  // 6. Maîtrise des coûts (charges vs CA)
  const prev = months.length >= 2 ? months[months.length - 2] : null;
  const expGrowth = prev
    ? pctChange(totalExpenses, prev.cogs + prev.operatingExpenses + prev.taxesAndOther) ?? 0
    : 0;
  const gap = expGrowth - revGrowth; // >0 = charges accélèrent plus vite
  const c6: HealthComponent = {
    label: "Maîtrise des coûts",
    weight: 10,
    score: scale(gap, 15, 0),
    note: `charges ${expGrowth.toFixed(1)} % vs CA ${revGrowth.toFixed(1)} %`,
  };

  // 7. Concentration client (part des 3 premiers dans le MRR)
  const mrrByClient = dataset.clients
    .map((c) => c.mrr)
    .sort((a, b) => b - a);
  const totalMrr = mrrByClient.reduce((a, b) => a + b, 0);
  const top3 = mrrByClient.slice(0, 3).reduce((a, b) => a + b, 0);
  const concentration = totalMrr > 0 ? (top3 / totalMrr) * 100 : 0;
  const c7: HealthComponent = {
    label: "Concentration client",
    weight: 10,
    score: totalMrr > 0 ? scale(concentration, 80, 40) : 60,
    note: totalMrr > 0 ? `${concentration.toFixed(0)} % du MRR sur 3 clients` : "MRR non réparti",
  };

  // 8. Créances (part en retard)
  const invoiced = dataset.invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled")
    .reduce((a, i) => a + i.amount, 0);
  const overdue = dataset.invoices
    .filter((i) => i.status === "overdue")
    .reduce((a, i) => a + i.amount, 0);
  const overdueShare = invoiced > 0 ? (overdue / invoiced) * 100 : 0;
  const c8: HealthComponent = {
    label: "Créances",
    weight: 5,
    score: scale(overdueShare, 25, 0),
    note: `${overdueShare.toFixed(0)} % du facturé en retard`,
  };

  // 9. Respect du budget (dépassement du mois courant)
  const currentMonth = last.month;
  const lines = dataset.budgetLines.filter((b) => b.month === currentMonth);
  const budgetTotal = lines.reduce((a, b) => a + b.budget, 0);
  const overrun = lines.reduce((a, b) => a + Math.max(b.actual - b.budget, 0), 0);
  const overrunShare = budgetTotal > 0 ? (overrun / budgetTotal) * 100 : 0;
  const c9: HealthComponent = {
    label: "Respect du budget",
    weight: 5,
    score: budgetTotal > 0 ? scale(overrunShare, 20, 0) : 70,
    note: budgetTotal > 0 ? `${overrunShare.toFixed(0)} % de dépassement` : "aucun budget défini",
  };

  const components = [c1, c2, c3, c4, c5, c6, c7, c8, c9];
  const weightSum = components.reduce((a, c) => a + c.weight, 0);
  const score = Math.round(
    components.reduce((a, c) => a + c.score * c.weight, 0) / weightSum,
  );

  const status: HealthStatus =
    score >= 80 ? "Solide" : score >= 60 ? "Correct" : score >= 40 ? "Fragile" : "Critique";

  return { score, status, components };
}
