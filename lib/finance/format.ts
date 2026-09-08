import type { CurrencyCode, MonthKey } from "./types";

/** RIXZA reports in FCFA — francophone Central Africa formatting. */
const DEFAULT_LOCALE = "fr-FR";

/** Currencies with no minor unit (FCFA, etc.). */
const ZERO_DECIMAL: CurrencyCode[] = ["XAF"];

export function formatMoney(
  amount: number | null | undefined,
  currency: CurrencyCode = "XAF",
  opts: { compact?: boolean; decimals?: number } = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const { compact = false, decimals } = opts;
  const zeroDecimal = ZERO_DECIMAL.includes(currency);
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? (compact ? 1 : zeroDecimal ? 0 : 2),
  }).format(amount);
}

export function formatPct(
  value: number | null | undefined,
  opts: { signed?: boolean; decimals?: number } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { signed = false, decimals = 1 } = opts;
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)} %`;
}

export function formatMonths(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "∞";
  return `${value.toFixed(1)} mois`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** "2026-09" -> "sept. 2026" */
export function formatMonthLabel(month: MonthKey, style: "short" | "long" = "short"): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(DEFAULT_LOCALE, {
    month: style,
    year: "numeric",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
