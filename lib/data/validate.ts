/**
 * Structural validation for record-level `RixzaData` coming from the app.
 * Throws `DatasetValidationError` with a readable French message on bad
 * input; otherwise returns a clean object with numbers coerced and ids
 * filled in.
 */

import type {
  ClientRecord,
  CurrencyCode,
  ExpenseCategory,
  ExpenseGroup,
  Frequency,
  InvoiceRecord,
  InvoiceStatus,
  PaymentMethod,
  PaymentRecord,
  PlanStatus,
  RecurringCostRecord,
  RevenueRecord,
  RixzaData,
  SalesChannel,
  ServiceLine,
  Subscription,
  BudgetTarget,
  FinancialGoal,
  GoalMetric,
} from "@/lib/finance/types";

export class DatasetValidationError extends Error {}

const CURRENCIES: CurrencyCode[] = ["EUR", "XAF", "USD", "CAD", "GBP"];
const STATUSES: InvoiceStatus[] = ["draft", "sent", "pending", "paid", "overdue", "cancelled"];
const GROUPS: ExpenseGroup[] = ["operations", "marketing", "human_resources", "sales", "administration"];
const METRICS: GoalMetric[] = ["revenue", "mrr", "arr", "profit", "cash", "clients"];
const CHANNELS: SalesChannel[] = ["outbound", "inbound", "referral", "partnership", "organic", "paid"];
const SERVICES: ServiceLine[] = [
  "strategy", "branding", "website", "landing", "ecommerce", "seo", "aeo_geo",
  "automation", "crm", "ai", "saas", "maintenance", "system", "transformation",
];
const CATEGORIES: ExpenseCategory[] = [
  "operations", "software", "infrastructure", "marketing", "sales", "human_resources",
  "freelancers", "office", "travel", "legal", "accounting", "taxes", "banking", "other",
];
const METHODS: PaymentMethod[] = ["bank", "mobile_money", "card", "cash", "other"];
const PLAN_STATUS: PlanStatus[] = ["active", "paused", "cancelled"];
const FREQ: Frequency[] = ["monthly", "quarterly", "yearly"];
const CLIENT_STATUS = ["prospect", "active", "churned"] as const;

function fail(msg: string): never {
  throw new DatasetValidationError(msg);
}
function obj(v: unknown, where: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(`${where} : objet attendu.`);
  return v as Record<string, unknown>;
}
function arr(v: unknown, where: string): unknown[] {
  if (v == null) return [];
  if (!Array.isArray(v)) fail(`${where} : liste attendue.`);
  return v;
}
function num(v: unknown, where: string): number {
  const n = typeof v === "string" ? Number(v.replace(/\s/g, "")) : (v as number);
  if (typeof n !== "number" || !Number.isFinite(n)) fail(`${where} : nombre invalide.`);
  return n;
}
function str(v: unknown, where: string): string {
  if (typeof v !== "string" || v.trim() === "") fail(`${where} : texte requis.`);
  return v.trim();
}
function optStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function nullableDate(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function date(v: unknown, where: string): string {
  const s = str(v, where);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail(`${where} : date attendue au format AAAA-MM-JJ.`);
  return s;
}
function month(v: unknown, where: string): string {
  const s = str(v, where);
  if (!/^\d{4}-\d{2}$/.test(s)) fail(`${where} : mois attendu au format AAAA-MM.`);
  return s;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], where: string, fallback?: T): T {
  const s = typeof v === "string" ? v.trim() : "";
  if (allowed.includes(s as T)) return s as T;
  if (fallback !== undefined) return fallback;
  fail(`${where} : valeur "${s}" non reconnue.`);
}
function bool(v: unknown): boolean {
  return v === true || v === "true";
}
function id(v: unknown, prefix: string, i: number): string {
  return optStr(v) || `${prefix}-${i + 1}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseRixzaData(input: unknown): RixzaData {
  const root = obj(input, "Données");
  const company = obj(root.company, "Entreprise");

  const clients: ClientRecord[] = arr(root.clients, "Clients").map((c, i) => {
    const o = obj(c, `Client #${i + 1}`);
    return {
      id: id(o.id, "client", i),
      name: str(o.name, `Client #${i + 1} — nom`),
      country: optStr(o.country),
      channel: oneOf(o.channel, CHANNELS, `Client #${i + 1} — canal`, "outbound"),
      services: Array.isArray(o.services)
        ? (o.services.filter((s) => SERVICES.includes(s as ServiceLine)) as ServiceLine[])
        : [],
      startDate: nullableDate(o.startDate),
      renewalDate: nullableDate(o.renewalDate),
      status: oneOf(o.status, CLIENT_STATUS, `Client #${i + 1} — statut`, "active"),
    };
  });

  const subscriptions: Subscription[] = arr(root.subscriptions, "Abonnements").map((s, i) => {
    const o = obj(s, `Abonnement #${i + 1}`);
    return {
      id: id(o.id, "sub", i),
      clientId: str(o.clientId, `Abonnement #${i + 1} — client`),
      label: optStr(o.label) || "Abonnement",
      productId: optStr(o.productId) || null,
      service: SERVICES.includes(o.service as ServiceLine) ? (o.service as ServiceLine) : null,
      amountPerMonth: num(o.amountPerMonth, `Abonnement #${i + 1} — montant mensuel`),
      startDate: date(o.startDate, `Abonnement #${i + 1} — début`),
      endDate: nullableDate(o.endDate),
      status: oneOf(o.status, PLAN_STATUS, `Abonnement #${i + 1} — statut`, "active"),
    };
  });

  const revenueRecords: RevenueRecord[] = arr(root.revenueRecords, "Revenus ponctuels").map((r, i) => {
    const o = obj(r, `Revenu #${i + 1}`);
    return {
      id: id(o.id, "rev", i),
      clientId: str(o.clientId, `Revenu #${i + 1} — client`),
      service: SERVICES.includes(o.service as ServiceLine) ? (o.service as ServiceLine) : null,
      productId: optStr(o.productId) || null,
      bookedOn: date(o.bookedOn, `Revenu #${i + 1} — date`),
      amount: num(o.amount, `Revenu #${i + 1} — montant`),
      description: optStr(o.description),
    };
  });

  const invoices: InvoiceRecord[] = arr(root.invoices, "Factures").map((v, i) => {
    const o = obj(v, `Facture #${i + 1}`);
    return {
      id: id(o.id, "inv", i),
      number: str(o.number, `Facture #${i + 1} — numéro`),
      clientId: str(o.clientId, `Facture #${i + 1} — client`),
      productId: optStr(o.productId) || null,
      issueDate: date(o.issueDate, `Facture #${i + 1} — émission`),
      dueDate: date(o.dueDate, `Facture #${i + 1} — échéance`),
      status: oneOf(o.status, STATUSES, `Facture #${i + 1} — statut`, "draft"),
      currency: oneOf(o.currency, CURRENCIES, `Facture #${i + 1} — devise`, "XAF"),
      amount: num(o.amount, `Facture #${i + 1} — montant`),
      exchangeRate: o.exchangeRate == null ? 1 : num(o.exchangeRate, `Facture #${i + 1} — taux de change`),
      note: optStr(o.note),
    };
  });

  const payments: PaymentRecord[] = arr(root.payments, "Paiements").map((p, i) => {
    const o = obj(p, `Paiement #${i + 1}`);
    return {
      id: id(o.id, "pay", i),
      invoiceId: optStr(o.invoiceId) || null,
      clientId: str(o.clientId, `Paiement #${i + 1} — client`),
      paidOn: date(o.paidOn, `Paiement #${i + 1} — date`),
      amount: num(o.amount, `Paiement #${i + 1} — montant`),
      method: oneOf(o.method, METHODS, `Paiement #${i + 1} — moyen`, "bank"),
    };
  });

  const expenses: RecordExpense[] = arr(root.expenses, "Dépenses").map((e, i) => {
    const o = obj(e, `Dépense #${i + 1}`);
    return {
      id: id(o.id, "exp", i),
      vendorName: optStr(o.vendorName),
      category: oneOf(o.category, CATEGORIES, `Dépense #${i + 1} — catégorie`, "other"),
      description: str(o.description, `Dépense #${i + 1} — description`),
      amount: num(o.amount, `Dépense #${i + 1} — montant`),
      spentOn: date(o.spentOn, `Dépense #${i + 1} — date`),
      isCogs: bool(o.isCogs),
    };
  });

  const recurringCosts: RecurringCostRecord[] = arr(root.recurringCosts, "Coûts récurrents").map((c, i) => {
    const o = obj(c, `Coût récurrent #${i + 1}`);
    return {
      id: id(o.id, "rc", i),
      vendorName: optStr(o.vendorName),
      label: str(o.label, `Coût récurrent #${i + 1} — libellé`),
      category: oneOf(o.category, CATEGORIES, `Coût récurrent #${i + 1} — catégorie`, "software"),
      amount: num(o.amount, `Coût récurrent #${i + 1} — montant`),
      frequency: oneOf(o.frequency, FREQ, `Coût récurrent #${i + 1} — fréquence`, "monthly"),
      startDate: date(o.startDate, `Coût récurrent #${i + 1} — début`),
      endDate: nullableDate(o.endDate),
      isCogs: bool(o.isCogs),
      status: oneOf(o.status, PLAN_STATUS, `Coût récurrent #${i + 1} — statut`, "active"),
    };
  });

  const budgetTargets: BudgetTarget[] = arr(root.budgetTargets, "Budget").map((b, i) => {
    const o = obj(b, `Ligne budget #${i + 1}`);
    return {
      month: month(o.month, `Ligne budget #${i + 1} — mois`),
      group: oneOf(o.group, GROUPS, `Ligne budget #${i + 1} — catégorie`, "operations"),
      label: str(o.label, `Ligne budget #${i + 1} — libellé`),
      budget: num(o.budget, `Ligne budget #${i + 1} — budget`),
    };
  });

  const goals: FinancialGoal[] = arr(root.goals, "Objectifs").map((g, i) => {
    const o = obj(g, `Objectif #${i + 1}`);
    return {
      id: id(o.id, "goal", i),
      label: str(o.label, `Objectif #${i + 1} — libellé`),
      metric: oneOf(o.metric, METRICS, `Objectif #${i + 1} — indicateur`, "arr"),
      target: num(o.target, `Objectif #${i + 1} — cible`),
      targetDate: date(o.targetDate, `Objectif #${i + 1} — date cible`),
      current: o.current == null ? 0 : num(o.current, `Objectif #${i + 1} — valeur`),
    };
  });

  const windowMonths = root.windowMonths == null ? 12 : Math.max(3, Math.round(num(root.windowMonths, "Fenêtre")));

  return {
    company: {
      id: optStr(company.id) || "rixza",
      name: str(company.name, "Nom de l'entreprise"),
      baseCurrency: oneOf(company.baseCurrency, CURRENCIES, "Devise de référence", "XAF"),
      openingCash: company.openingCash == null ? 0 : num(company.openingCash, "Trésorerie d'ouverture"),
      openingCashDate: company.openingCashDate
        ? date(company.openingCashDate, "Date d'ouverture")
        : new Date().toISOString().slice(0, 8) + "01",
    },
    clients,
    subscriptions,
    revenueRecords,
    invoices,
    payments,
    expenses,
    recurringCosts,
    budgetTargets,
    goals,
    windowMonths,
  };
}

type RecordExpense = RixzaData["expenses"][number];
