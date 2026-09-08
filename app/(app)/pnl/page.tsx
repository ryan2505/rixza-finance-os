import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MethodDetails } from "@/components/command-center/method";
import { getStore } from "@/lib/data";
import { formatMoney, formatPct } from "@/lib/finance/format";
import type { MonthlyFinancials } from "@/lib/finance/types";

export const metadata = { title: "Compte de résultat" };

function revenue(m: MonthlyFinancials) {
  return m.recurringRevenue + m.oneTimeRevenue;
}
function grossProfit(m: MonthlyFinancials) {
  return revenue(m) - m.cogs;
}
function operatingProfit(m: MonthlyFinancials) {
  return grossProfit(m) - m.operatingExpenses;
}
function netProfit(m: MonthlyFinancials) {
  return operatingProfit(m) - m.taxesAndOther;
}

export default async function PnlPage() {
  const dataset = await getStore().getDataset();
  const cur = dataset.company.baseCurrency;
  const months = dataset.months;

  const col = (fn: (m: MonthlyFinancials) => number) => months.map(fn);
  const total = (fn: (m: MonthlyFinancials) => number) => months.reduce((a, m) => a + fn(m), 0);

  const lines: {
    label: string;
    values: number[];
    total: number;
    kind: "revenue" | "minus" | "subtotal" | "net";
  }[] = [
    { label: "Chiffre d'affaires", values: col(revenue), total: total(revenue), kind: "revenue" },
    { label: "− Coûts directs (COGS)", values: col((m) => m.cogs), total: total((m) => m.cogs), kind: "minus" },
    { label: "= Marge brute", values: col(grossProfit), total: total(grossProfit), kind: "subtotal" },
    { label: "− Charges d'exploitation", values: col((m) => m.operatingExpenses), total: total((m) => m.operatingExpenses), kind: "minus" },
    { label: "= Résultat d'exploitation", values: col(operatingProfit), total: total(operatingProfit), kind: "subtotal" },
    { label: "− Taxes & autres", values: col((m) => m.taxesAndOther), total: total((m) => m.taxesAndOther), kind: "minus" },
    { label: "= Résultat net", values: col(netProfit), total: total(netProfit), kind: "net" },
  ];

  const marginRow = months.map((m) => {
    const r = revenue(m);
    return r === 0 ? null : (netProfit(m) / r) * 100;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="Compte de résultat"
        description="Chiffre d'affaires → coûts directs → marge brute → charges → résultat d'exploitation → taxes → résultat net. Mois par mois, sur la fenêtre du tableau de bord."
      />

      <Card>
        <CardHeader
          title="P&L mensuel"
          hint={`${months.length} mois · devise ${cur}`}
        />
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-3">
                <th className="px-5 py-2.5 text-left font-medium">Poste</th>
                {months.map((m) => (
                  <th key={m.month} className="px-3 py-2.5 text-right font-medium">
                    {m.month}
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.label}
                  className={
                    line.kind === "net"
                      ? "border-t border-border-strong bg-accent-soft font-semibold text-accent"
                      : line.kind === "subtotal"
                        ? "border-t border-border font-medium text-ink"
                        : "text-ink-2"
                  }
                >
                  <td className="px-5 py-2">{line.label}</td>
                  {line.values.map((v, i) => (
                    <td key={i} className="num px-3 py-2 text-right">
                      {formatMoney(v, cur)}
                    </td>
                  ))}
                  <td className="num px-5 py-2 text-right">{formatMoney(line.total, cur)}</td>
                </tr>
              ))}
              <tr className="border-t border-border text-xs text-ink-3">
                <td className="px-5 py-2">Taux de marge nette</td>
                {marginRow.map((v, i) => (
                  <td key={i} className="num px-3 py-2 text-right">
                    {v === null ? "—" : formatPct(v)}
                  </td>
                ))}
                <td className="num px-5 py-2 text-right">
                  {total(revenue) === 0 ? "—" : formatPct((total(netProfit) / total(revenue)) * 100)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <MethodDetails
            summary="Comment le P&L est construit"
            items={[
              { term: "Chiffre d'affaires", def: "MRR reconnu du mois (abonnements actifs) + revenus ponctuels datés dans le mois." },
              { term: "Coûts directs (COGS)", def: "Dépenses marquées « coût direct » + coûts récurrents marqués COGS (ramenés au mois)." },
              { term: "Charges d'exploitation", def: "Toutes les autres dépenses et coûts récurrents du mois, hors taxes." },
              { term: "Taxes & autres", def: "Dépenses de catégorie « Taxes & impôts »." },
              { term: "Résultat net", def: "CA − COGS − Charges d'exploitation − Taxes & autres." },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
