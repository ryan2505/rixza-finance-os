import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A single headline figure: small label, large tabular value, optional sub-line. */
export function Metric({
  label,
  value,
  sub,
  emphasis = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  emphasis?: "default" | "hero" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium tracking-wide text-ink-3 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "metric-value text-ink",
          emphasis === "hero"
            ? "text-3xl font-semibold"
            : emphasis === "muted"
              ? "text-lg font-medium text-ink-2"
              : "text-xl font-semibold",
        )}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-ink-3">{sub}</span> : null}
    </div>
  );
}

/** Responsive grid of metrics with hairline dividers. */
export function MetricGrid({
  columns = 3,
  children,
  className,
}: {
  columns?: 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}) {
  const cols: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };
  return (
    <div className={cn("grid grid-cols-1 gap-x-6 gap-y-6", cols[columns], className)}>
      {children}
    </div>
  );
}
