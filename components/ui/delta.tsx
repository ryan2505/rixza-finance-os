import { formatPct } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

/**
 * Signed percentage change with directional colour.
 * `invert` flips the colour meaning (used where "up" is bad, e.g. expenses/burn).
 */
export function Delta({
  value,
  invert = false,
  neutralAtZero = true,
  suffix = "vs mois précédent",
  className,
}: {
  value: number | null;
  invert?: boolean;
  neutralAtZero?: boolean;
  suffix?: string;
  className?: string;
}) {
  if (value === null || Number.isNaN(value)) {
    return <span className={cn("text-xs text-ink-3", className)}>—</span>;
  }

  const isZero = Math.abs(value) < 0.05;
  const positiveDirection = value > 0;
  const good = invert ? !positiveDirection : positiveDirection;

  const tone =
    isZero && neutralAtZero ? "text-ink-3" : good ? "text-pos" : "text-neg";

  const arrow = isZero ? "→" : positiveDirection ? "↑" : "↓";

  return (
    <span
      className={cn(
        "num inline-flex items-baseline gap-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      <span aria-hidden>{arrow}</span>
      {formatPct(Math.abs(value), { decimals: 1 })}
      {suffix ? <span className="font-normal text-ink-3">{suffix}</span> : null}
    </span>
  );
}
