/**
 * French labels + option lists for the domain enums.
 * Plain module (no "use client") so both Server and Client Components can
 * import it.
 */

type Opt = { value: string; label: string };
const opts = (pairs: [string, string][]): Opt[] =>
  pairs.map(([value, label]) => ({ value, label }));

export const CURRENCY_OPTIONS: Opt[] = ["XAF", "EUR", "USD", "CAD", "GBP"].map((c) => ({
  value: c,
  label: c === "XAF" ? "XAF — FCFA" : c,
}));

export const INVOICE_STATUS_OPTIONS = opts([
  ["draft", "Brouillon"],
  ["sent", "Envoyée"],
  ["pending", "En attente"],
  ["paid", "Payée"],
  ["overdue", "En retard"],
  ["cancelled", "Annulée"],
]);

export const EXPENSE_CATEGORY_OPTIONS = opts([
  ["operations", "Opérations"],
  ["software", "Logiciels"],
  ["infrastructure", "Infrastructure"],
  ["marketing", "Marketing"],
  ["sales", "Commercial"],
  ["human_resources", "Ressources humaines"],
  ["freelancers", "Freelances"],
  ["office", "Bureau"],
  ["travel", "Déplacements"],
  ["legal", "Juridique"],
  ["accounting", "Comptabilité"],
  ["taxes", "Taxes & impôts"],
  ["banking", "Frais bancaires"],
  ["other", "Autre"],
]);

export const CHANNEL_OPTIONS = opts([
  ["outbound", "Outbound"],
  ["inbound", "Inbound"],
  ["referral", "Recommandation"],
  ["partnership", "Partenariat"],
  ["organic", "Organique"],
  ["paid", "Payant"],
]);

export const SERVICE_OPTIONS = opts([
  ["strategy", "Stratégie"],
  ["branding", "Branding"],
  ["website", "Website"],
  ["landing", "Landing Page"],
  ["ecommerce", "E-commerce"],
  ["seo", "SEO"],
  ["aeo_geo", "AEO / GEO"],
  ["automation", "Automation"],
  ["crm", "CRM"],
  ["ai", "IA"],
  ["saas", "SaaS"],
  ["maintenance", "Maintenance"],
  ["system", "System"],
  ["transformation", "Transformation"],
]);

export const CLIENT_STATUS_OPTIONS = opts([
  ["prospect", "Prospect"],
  ["active", "Actif"],
  ["churned", "Perdu"],
]);

export const PLAN_STATUS_OPTIONS = opts([
  ["active", "Actif"],
  ["paused", "En pause"],
  ["cancelled", "Annulé"],
]);

export const FREQ_OPTIONS = opts([
  ["monthly", "Mensuel"],
  ["quarterly", "Trimestriel"],
  ["yearly", "Annuel"],
]);

export const METHOD_OPTIONS = opts([
  ["bank", "Virement"],
  ["mobile_money", "Mobile Money"],
  ["card", "Carte"],
  ["cash", "Espèces"],
  ["other", "Autre"],
]);

export const BUDGET_GROUP_OPTIONS = opts([
  ["operations", "Opérations"],
  ["marketing", "Marketing"],
  ["human_resources", "Ressources humaines"],
  ["sales", "Commercial"],
  ["administration", "Administration"],
]);

export const GOAL_METRIC_OPTIONS = opts([
  ["revenue", "Chiffre d'affaires"],
  ["mrr", "MRR"],
  ["arr", "ARR"],
  ["profit", "Résultat net"],
  ["cash", "Trésorerie"],
  ["clients", "Nombre de clients"],
]);

export function labelOf(options: Opt[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
