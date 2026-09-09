/**
 * Catalogue RIXZA — Pricing Engine V2.0 (Market-Calibrated Edition).
 * Prix commerciaux recommandés en FCFA. Une plage => `price` = bas de
 * fourchette (recommandé), `priceMax` = haut.
 *
 * Sert à pré-remplir les montants à la saisie d'un revenu / abonnement /
 * facture, et à ventiler le chiffre d'affaires « par offre ».
 */

import type { ServiceLine } from "./types";

export type CatalogueKind = "product" | "system" | "addon";

export interface CatalogueItem {
  id: string;
  category: ServiceLine;
  name: string;
  /** Prix recommandé V2 (FCFA). Par mois si `recurring`. */
  price: number;
  /** Haut de fourchette si le doc donne une plage. */
  priceMax?: number;
  recurring: boolean;
  kind: CatalogueKind;
  note?: string;
}

export const CATALOGUE: CatalogueItem[] = [
  // A — Stratégie
  { id: "x-ray", category: "strategy", name: "RIXZA X-Ray", price: 0, recurring: false, kind: "product", note: "Acquisition + qualification" },
  { id: "x-ray-pro", category: "strategy", name: "X-Ray PRO", price: 125_000, recurring: false, kind: "product", note: "Audit premium accessible" },
  { id: "strategy-sprint", category: "strategy", name: "Digital Strategy Sprint", price: 200_000, priceMax: 350_000, recurring: false, kind: "product", note: "Diagnostic + roadmap" },

  // B — Branding
  { id: "brand-starter", category: "branding", name: "Brand Starter", price: 250_000, recurring: false, kind: "product" },
  { id: "brand-identity", category: "branding", name: "Brand Identity", price: 550_000, recurring: false, kind: "product" },
  { id: "brand-authority", category: "branding", name: "Brand Authority", price: 1_000_000, priceMax: 1_500_000, recurring: false, kind: "product" },

  // C — Website
  { id: "website-essential", category: "website", name: "Website Essential", price: 350_000, recurring: false, kind: "product", note: "≤ 5 pages, responsive, SEO technique" },
  { id: "website-professional", category: "website", name: "Website Professional", price: 650_000, recurring: false, kind: "product", note: "Produit cœur — UX/UI custom, ≤ 10 pages, conversion" },
  { id: "website-premium", category: "website", name: "Website Premium", price: 1_200_000, recurring: false, kind: "product", note: "Design system, AEO/GEO, CRM, automation légère" },
  { id: "website-corporate", category: "website", name: "Corporate / Enterprise", price: 2_000_000, priceMax: 4_000_000, recurring: false, kind: "product", note: "Sur mesure" },

  // D — Landing Page
  { id: "landing-page", category: "landing", name: "Landing Page", price: 180_000, recurring: false, kind: "product" },
  { id: "landing-page-pro", category: "landing", name: "Landing Page PRO", price: 300_000, recurring: false, kind: "product" },
  { id: "conversion-landing-system", category: "landing", name: "Conversion Landing System", price: 500_000, recurring: false, kind: "product" },

  // E — E-commerce
  { id: "ecommerce-starter", category: "ecommerce", name: "E-commerce Starter", price: 750_000, recurring: false, kind: "product" },
  { id: "ecommerce-growth", category: "ecommerce", name: "E-commerce Growth", price: 1_200_000, recurring: false, kind: "product" },
  { id: "ecommerce-premium", category: "ecommerce", name: "E-commerce Premium", price: 2_000_000, priceMax: 3_000_000, recurring: false, kind: "product" },

  // F — SEO
  { id: "seo-audit", category: "seo", name: "SEO Audit", price: 100_000, recurring: false, kind: "product", note: "One-shot" },
  { id: "seo-foundation", category: "seo", name: "SEO Foundation", price: 150_000, recurring: true, kind: "product" },
  { id: "seo-growth", category: "seo", name: "SEO Growth", price: 300_000, recurring: true, kind: "product" },
  { id: "seo-authority", category: "seo", name: "SEO Authority", price: 500_000, recurring: true, kind: "product" },

  // G — AEO / GEO
  { id: "ai-visibility-audit", category: "aeo_geo", name: "AI Visibility Audit", price: 150_000, recurring: false, kind: "product" },
  { id: "ai-visibility-growth", category: "aeo_geo", name: "AI Visibility Growth", price: 300_000, recurring: true, kind: "product" },
  { id: "ai-authority", category: "aeo_geo", name: "AI Authority", price: 500_000, priceMax: 750_000, recurring: true, kind: "product" },

  // H — Automation
  { id: "automation-starter", category: "automation", name: "Automation Starter", price: 200_000, recurring: false, kind: "product" },
  { id: "automation-system", category: "automation", name: "Automation System", price: 400_000, priceMax: 700_000, recurring: false, kind: "product" },
  { id: "automation-infrastructure", category: "automation", name: "Automation Infrastructure", price: 800_000, priceMax: 1_800_000, recurring: false, kind: "product" },

  // I — CRM
  { id: "crm-setup", category: "crm", name: "CRM Setup", price: 400_000, recurring: false, kind: "product" },
  { id: "crm-custom", category: "crm", name: "CRM Custom", price: 800_000, priceMax: 1_500_000, recurring: false, kind: "product" },
  { id: "crm-business-system", category: "crm", name: "CRM Business System", price: 1_500_000, priceMax: 3_000_000, recurring: false, kind: "product" },

  // J — IA
  { id: "ai-integration", category: "ai", name: "AI Integration", price: 250_000, priceMax: 400_000, recurring: false, kind: "product" },
  { id: "ai-assistant", category: "ai", name: "AI Assistant", price: 600_000, priceMax: 1_200_000, recurring: false, kind: "product" },
  { id: "ai-agent", category: "ai", name: "AI Agent", price: 1_200_000, priceMax: 3_000_000, recurring: false, kind: "product" },
  { id: "ai-platform", category: "ai", name: "AI Platform", price: 4_000_000, priceMax: 10_000_000, recurring: false, kind: "product" },

  // K — SaaS
  { id: "saas-prototype", category: "saas", name: "Prototype", price: 600_000, priceMax: 1_200_000, recurring: false, kind: "product" },
  { id: "saas-mvp", category: "saas", name: "MVP", price: 1_500_000, priceMax: 3_000_000, recurring: false, kind: "product" },
  { id: "saas-business", category: "saas", name: "Business SaaS", price: 3_000_000, priceMax: 6_000_000, recurring: false, kind: "product" },
  { id: "saas-advanced", category: "saas", name: "Advanced SaaS", price: 6_000_000, priceMax: 12_000_000, recurring: false, kind: "product" },

  // L — Maintenance
  { id: "care", category: "maintenance", name: "CARE", price: 50_000, recurring: true, kind: "product" },
  { id: "growth-care", category: "maintenance", name: "GROWTH", price: 100_000, recurring: true, kind: "product" },
  { id: "partner-care", category: "maintenance", name: "PARTNER", price: 200_000, priceMax: 350_000, recurring: true, kind: "product" },

  // §11 — Systems
  { id: "lead-engine", category: "system", name: "LEAD ENGINE", price: 1_200_000, priceMax: 2_000_000, recurring: false, kind: "system", note: "Website/landing + CRM + WhatsApp + automation + analytics" },
  { id: "growth-engine", category: "system", name: "GROWTH ENGINE", price: 2_000_000, priceMax: 4_000_000, recurring: false, kind: "system", note: "Website + SEO + AEO/GEO + CRM + automation + CRO" },
  { id: "operations-system", category: "system", name: "OPERATIONS SYSTEM", price: 2_000_000, priceMax: 4_500_000, recurring: false, kind: "system", note: "CRM + dashboards + workflows + automation + IA" },
  { id: "ai-system", category: "system", name: "AI SYSTEM", price: 2_500_000, priceMax: 7_500_000, recurring: false, kind: "system", note: "Assistant/agents + knowledge base + APIs + dashboard" },
  { id: "digital-infrastructure", category: "transformation", name: "DIGITAL INFRASTRUCTURE", price: 4_000_000, priceMax: 12_000_000, recurring: false, kind: "system", note: "Architecture digitale complète" },

  // §10 — Add-ons (principaux)
  { id: "addon-page", category: "website", name: "Page supplémentaire", price: 40_000, priceMax: 75_000, recurring: false, kind: "addon" },
  { id: "addon-landing", category: "landing", name: "Landing page supplémentaire", price: 120_000, priceMax: 200_000, recurring: false, kind: "addon" },
  { id: "addon-animation", category: "website", name: "Animation avancée", price: 75_000, priceMax: 250_000, recurring: false, kind: "addon" },
  { id: "addon-copywriting", category: "website", name: "Copywriting complet", price: 75_000, priceMax: 250_000, recurring: false, kind: "addon" },
  { id: "addon-aeo-geo", category: "aeo_geo", name: "AEO/GEO", price: 125_000, priceMax: 400_000, recurring: false, kind: "addon" },
  { id: "addon-crm-integration", category: "crm", name: "CRM integration", price: 125_000, priceMax: 400_000, recurring: false, kind: "addon" },
  { id: "addon-whatsapp", category: "automation", name: "WhatsApp integration", price: 75_000, priceMax: 200_000, recurring: false, kind: "addon" },
  { id: "addon-email-automation", category: "automation", name: "Email automation", price: 75_000, priceMax: 250_000, recurring: false, kind: "addon" },
  { id: "addon-workflow", category: "automation", name: "Workflow automation", price: 75_000, priceMax: 250_000, recurring: false, kind: "addon" },
  { id: "addon-api", category: "automation", name: "API integration", price: 125_000, priceMax: 400_000, recurring: false, kind: "addon" },
  { id: "addon-ai", category: "ai", name: "AI integration", price: 200_000, priceMax: 600_000, recurring: false, kind: "addon" },
  { id: "addon-dashboard", category: "saas", name: "Dashboard", price: 250_000, priceMax: 750_000, recurring: false, kind: "addon" },
  { id: "addon-auth", category: "saas", name: "Auth system", price: 125_000, priceMax: 400_000, recurring: false, kind: "addon" },
  { id: "addon-payment", category: "ecommerce", name: "Payment integration", price: 125_000, priceMax: 300_000, recurring: false, kind: "addon" },
  { id: "addon-booking", category: "automation", name: "Booking system", price: 100_000, priceMax: 300_000, recurring: false, kind: "addon" },
];

const BY_ID = new Map(CATALOGUE.map((i) => [i.id, i]));

export function catalogueItem(id: string | null | undefined): CatalogueItem | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function catalogueName(id: string | null | undefined): string {
  return catalogueItem(id)?.name ?? "—";
}

/** { value, label } options for a <select>. `filter` narrows the list. */
export function catalogueOptions(
  filter?: (i: CatalogueItem) => boolean,
): { value: string; label: string }[] {
  return CATALOGUE.filter((i) => (filter ? filter(i) : true)).map((i) => ({
    value: i.id,
    label: `${i.name} — ${formatFcfa(i.price)}${i.recurring ? "/mois" : ""}${
      i.priceMax ? `–${formatFcfa(i.priceMax)}` : ""
    }`,
  }));
}

function formatFcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

/** Margin protection bands (Pricing Engine §4 / §19 / §21), on GROSS margin %. */
export const MARGIN_FLOOR_PCT = 50;
export const MARGIN_REJECT_PCT = 45;
export const MARGIN_CORE_LOW_PCT = 55;
export const MARGIN_CORE_HIGH_PCT = 65;
export const MARGIN_PREMIUM_HIGH_PCT = 75;
