/**
 * Synthèse de direction déterministe — remplit l'encart « briefing » du
 * Command Center (§30) sans IA. Règles explicites, remplaçable plus tard
 * par le module AI Intelligence.
 */

import { formatMoney, formatPct } from "./format";
import type { CommandCenterSnapshot } from "./snapshot";

export type HealthRating = "Solide" | "Stable" | "À surveiller" | "Sous tension";

export interface Briefing {
  rating: HealthRating;
  headline: string;
  lines: string[];
}

export function buildBriefing(s: CommandCenterSnapshot): Briefing {
  const cur = s.currency;
  const lines: string[] = [];

  const revChange = s.revenue.mtd.changePct;
  if (revChange !== null) {
    lines.push(
      `Chiffre d'affaires ${revChange >= 0 ? "en hausse" : "en baisse"} de ${formatPct(Math.abs(revChange))} sur un mois, à ${formatMoney(s.revenue.mtd.value, cur)}.`,
    );
  }

  if (s.revenue.recurringShare !== null) {
    lines.push(
      `${formatPct(s.revenue.recurringShare, { decimals: 0 })} du chiffre d'affaires du mois est récurrent.`,
    );
  }

  const mrrChange = s.recurring.endingMrr.changePct;
  if (mrrChange !== null) {
    lines.push(
      `MRR ${mrrChange >= 0 ? "en hausse" : "en baisse"} de ${formatPct(Math.abs(mrrChange))}, à ${formatMoney(s.recurring.endingMrr.value, cur)} — soit ${formatMoney(s.recurring.arr, cur)} d'ARR.`,
    );
  }

  if (s.cash.runwayMonths !== null) {
    lines.push(
      `La trésorerie de ${formatMoney(s.cash.balance, cur)} couvre environ ${s.cash.runwayMonths.toFixed(1)} mois d'activité au rythme de consommation actuel.`,
    );
  } else {
    lines.push(
      `L'entreprise ne consomme pas sa trésorerie : le flux de trésorerie net est positif, à ${formatMoney(s.cash.netCashFlow, cur)} ce mois-ci.`,
    );
  }

  if (s.profitability.netMargin !== null) {
    lines.push(
      `La marge nette est de ${formatPct(s.profitability.netMargin)} sur ${formatMoney(s.profitability.grossRevenue, cur)} de chiffre d'affaires.`,
    );
  }

  const runway = s.cash.runwayMonths;
  const marginPositive = (s.profitability.netMargin ?? 0) > 0;
  const growing = (revChange ?? 0) >= 0;

  let rating: HealthRating;
  if (runway !== null && runway < 3) rating = "Sous tension";
  else if (runway !== null && runway < 6) rating = "À surveiller";
  else if (growing && marginPositive) rating = "Solide";
  else rating = "Stable";

  const headline: Record<HealthRating, string> = {
    Solide: "Le chiffre d'affaires progresse et l'entreprise est rentable ce mois-ci.",
    Stable: "La situation est stable ; surveiller l'évolution de la marge et de la consommation de trésorerie.",
    "À surveiller": "La trésorerie se resserre — prioriser le recouvrement et la maîtrise des coûts.",
    "Sous tension": "La trésorerie est critique — une action immédiate sur le cash est nécessaire.",
  };

  return { rating, headline: headline[rating], lines };
}
