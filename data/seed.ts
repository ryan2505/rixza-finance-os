/**
 * État initial de RIXZA Finance OS — VIDE, en FCFA (XAF).
 *
 * Aucune donnée fictive. La direction saisit les enregistrements réels
 * (clients, abonnements, factures, paiements, dépenses…) depuis les
 * écrans dédiés. Les chiffres mensuels du Command Center sont calculés
 * automatiquement à partir de ces enregistrements (voir
 * lib/finance/derive.ts). Persisté dans data/dataset.local.json.
 */

import type { RixzaData } from "@/lib/finance/types";

function currentMonthStart(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export const seedData: RixzaData = {
  company: {
    id: "rixza",
    name: "RIXZA",
    baseCurrency: "XAF",
    openingCash: 0,
    openingCashDate: currentMonthStart(),
  },
  clients: [],
  subscriptions: [],
  revenueRecords: [],
  invoices: [],
  payments: [],
  expenses: [],
  recurringCosts: [],
  budgetTargets: [],
  goals: [],
  windowMonths: 12,
};
