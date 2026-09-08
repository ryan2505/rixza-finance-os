/**
 * RIXZA Finance OS — pure financial calculations.
 *
 * Every function here is deterministic and side-effect free so it can be
 * unit tested and reused on the server, the client, or in a worker.
 * Inputs and outputs are all in the base reporting currency.
 */

import type { MrrMovement } from "./types";

/** Percentage change from `previous` to `current`. `null` when undefined (no base). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// --- Recurring revenue -------------------------------------------------------

export function arrFromMrr(mrr: number): number {
  return mrr * 12;
}

export function netNewMrr(m: MrrMovement): number {
  return m.newMrr + m.expansion - m.contraction - m.churned;
}

/** MRR at the start of a period given the end value and the movement within it. */
export function startingMrr(endingMrr: number, m: MrrMovement): number {
  return endingMrr - netNewMrr(m);
}

/** Monthly churn rate: MRR churned / starting MRR. */
export function mrrChurnRate(startingMrr: number, churnedMrr: number): number | null {
  if (startingMrr <= 0) return null;
  return (churnedMrr / startingMrr) * 100;
}

// --- Profitability ---------------------------------------------------------

export function grossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

export function operatingProfit(grossProfit: number, operatingExpenses: number): number {
  return grossProfit - operatingExpenses;
}

export function netProfit(operatingProfit: number, taxesAndOther: number): number {
  return operatingProfit - taxesAndOther;
}

/** Any margin as a percentage of revenue. `null` when there is no revenue. */
export function margin(part: number, revenue: number): number | null {
  if (revenue === 0) return null;
  return (part / revenue) * 100;
}

// --- Cash ----------------------------------------------------------------

export function netCashFlow(cashIn: number, cashOut: number): number {
  return cashIn - cashOut;
}

/** Gross burn = total cash outflow / expenses for the period. */
export function grossBurn(totalExpenses: number): number {
  return totalExpenses;
}

/** Net burn = expenses not covered by revenue. Floored at 0 (profitable => not burning). */
export function netBurn(totalExpenses: number, revenue: number): number {
  return Math.max(totalExpenses - revenue, 0);
}

/**
 * Runway in months = cash balance / average monthly net burn.
 * Returns `null` when the company is not burning cash (infinite runway).
 */
export function runwayMonths(cashBalance: number, avgMonthlyNetBurn: number): number | null {
  if (avgMonthlyNetBurn <= 0) return null;
  return cashBalance / avgMonthlyNetBurn;
}

// --- Budget --------------------------------------------------------------

export type VarianceStatus = "under" | "warning" | "over";

export interface BudgetVariance {
  variance: number; // actual - budget (positive = spent more)
  ratio: number; // actual / budget
  status: VarianceStatus;
}

export function budgetVariance(
  budget: number,
  actual: number,
  warnRatio = 0.9,
): BudgetVariance {
  const variance = actual - budget;
  const ratio = budget === 0 ? (actual > 0 ? Number.POSITIVE_INFINITY : 0) : actual / budget;
  let status: VarianceStatus = "under";
  if (ratio > 1) status = "over";
  else if (ratio >= warnRatio) status = "warning";
  return { variance, ratio, status };
}

// --- Goals / forecast --------------------------------------------------------

/**
 * Compound monthly growth rate required to get from `current` to `target`
 * in `months` steps, as a percentage. `null` when the inputs make it undefined.
 */
export function requiredMonthlyGrowth(
  current: number,
  target: number,
  months: number,
): number | null {
  if (current <= 0 || months <= 0 || target <= 0) return null;
  return (Math.pow(target / current, 1 / months) - 1) * 100;
}

export function goalProgress(current: number, target: number): number | null {
  if (target === 0) return null;
  return (current / target) * 100;
}

/**
 * Least-squares linear projection. Given a numeric `series` (oldest first),
 * returns the next `periods` projected values, floored at 0.
 */
export function linearForecast(series: number[], periods: number): number[] {
  const n = series.length;
  if (n === 0 || periods <= 0) return [];
  if (n === 1) return Array.from({ length: periods }, () => Math.max(series[0], 0));

  const xs = series.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = series.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * series[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return Array.from({ length: periods }, (_, k) => {
    const x = n + k;
    return Math.max(intercept + slope * x, 0);
  });
}

/** Months between two "YYYY-MM" keys (b - a). */
export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Probability-weighted value of a sales pipeline. */
export function weightedPipeline(
  opportunities: { amount: number; probability: number }[],
): number {
  return opportunities.reduce((acc, o) => acc + o.amount * o.probability, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
