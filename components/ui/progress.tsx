import { cn } from "@/lib/utils";

/** Horizontal progress toward a target. Clamps display to 0–100%. */
export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number | null;
  tone?: "accent" | "pos" | "warn" | "neg";
  className?: string;
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const bar: Record<string, string> = {
    accent: "bg-accent",
    pos: "bg-pos",
    warn: "bg-warn",
    neg: "bg-neg",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", bar[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
