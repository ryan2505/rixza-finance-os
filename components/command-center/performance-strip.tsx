import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import type { CommandCenterSnapshot } from "@/lib/finance/snapshot";

/** Tendance sur un mois des quatre lignes clés. */
export function PerformanceStrip({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const s = snapshot;
  const rows: { label: string; value: number | null; invert?: boolean }[] = [
    { label: "CA", value: s.revenue.mtd.changePct },
    { label: "MRR", value: s.recurring.endingMrr.changePct },
    { label: "Charges", value: s.profitability.totalExpenses.changePct, invert: true },
    { label: "Résultat net", value: s.profitability.netProfit.changePct },
  ];

  return (
    <Card>
      <CardHeader title="Performance" hint="Variation vs mois précédent · (n − n−1) ÷ |n−1| × 100" />
      <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-ink-3 uppercase">
              {r.label}
            </span>
            <Delta value={r.value} invert={r.invert} suffix="" className="text-sm" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
