import { formatMoney, formatMonths } from "@/lib/finance/format";
import type { CommandCenterSnapshot } from "@/lib/finance/snapshot";
import { Delta } from "@/components/ui/delta";
import { cn } from "@/lib/utils";

/**
 * Vue direction — les sept chiffres à lire en moins de 60 secondes,
 * chacun avec sa tendance sur un mois.
 */
export function ExecutiveStrip({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const s = snapshot;
  const cur = s.currency;

  const tiles: {
    label: string;
    value: string;
    delta?: number | null;
    invert?: boolean;
    tone?: "danger" | "warn" | "normal";
  }[] = [
    { label: "CA du mois", value: formatMoney(s.revenue.mtd.value, cur), delta: s.revenue.mtd.changePct },
    { label: "MRR", value: formatMoney(s.recurring.endingMrr.value, cur), delta: s.recurring.endingMrr.changePct },
    { label: "ARR", value: formatMoney(s.recurring.arr, cur, { compact: true }) },
    {
      label: "Charges",
      value: formatMoney(s.profitability.totalExpenses.value, cur),
      delta: s.profitability.totalExpenses.changePct,
      invert: true,
    },
    { label: "Résultat net", value: formatMoney(s.profitability.netProfit.value, cur), delta: s.profitability.netProfit.changePct },
    { label: "Trésorerie", value: formatMoney(s.cash.balance, cur) },
    {
      label: "Autonomie",
      value: formatMonths(s.cash.runwayMonths),
      tone:
        s.cash.runwayMonths !== null && s.cash.runwayMonths < 3
          ? "danger"
          : s.cash.runwayMonths !== null && s.cash.runwayMonths < 6
            ? "warn"
            : "normal",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border sm:grid-cols-3 lg:grid-cols-7">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col gap-1.5 bg-surface p-4">
          <span className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">
            {t.label}
          </span>
          <span
            className={cn(
              "metric-value text-lg font-semibold",
              t.tone === "danger" ? "text-neg" : t.tone === "warn" ? "text-warn" : "text-ink",
            )}
          >
            {t.value}
          </span>
          {t.delta !== undefined ? (
            <Delta value={t.delta} invert={t.invert} suffix="" />
          ) : (
            <span className="h-4" />
          )}
        </div>
      ))}
    </div>
  );
}
