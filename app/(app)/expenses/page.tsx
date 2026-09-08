import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { ExpensesEditor } from "@/components/expenses/expenses-editor";
import { getStore } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials } from "@/lib/auth/config";
import { formatMoney, formatPct } from "@/lib/finance/format";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/finance/labels";
import type { ExpenseCategory } from "@/lib/finance/types";

export const metadata = { title: "Dépenses" };

const catLabel = (v: string) => EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === v)?.label ?? v;

function monthKey(iso: string) {
  return iso.slice(0, 7);
}
function monthlyEquiv(amount: number, freq: string) {
  return freq === "yearly" ? amount / 12 : freq === "quarterly" ? amount / 3 : amount;
}

export default async function ExpensesPage() {
  const [data, dataset, user] = await Promise.all([
    getStore().getData(),
    getStore().getDataset(),
    getCurrentUser(),
  ]);
  const canEdit = canEditFinancials(user?.role);
  const cur = dataset.company.baseCurrency;

  const months = dataset.months;
  const last = months[months.length - 1];
  const prev = months.length >= 2 ? months[months.length - 2] : null;
  const lastTotal = last.cogs + last.operatingExpenses + last.taxesAndOther;
  const prevTotal = prev ? prev.cogs + prev.operatingExpenses + prev.taxesAndOther : null;
  const growth =
    prevTotal && prevTotal !== 0 ? ((lastTotal - prevTotal) / Math.abs(prevTotal)) * 100 : null;

  const activeRecurring = data.recurringCosts.filter((c) => c.status === "active");
  const monthlyFixed = activeRecurring.reduce(
    (a, c) => a + monthlyEquiv(c.amount, c.frequency),
    0,
  );

  // by category, current month
  const byCat = new Map<ExpenseCategory, number>();
  for (const e of data.expenses) {
    if (monthKey(e.spentOn) !== last.month) continue;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  for (const c of activeRecurring) {
    byCat.set(c.category, (byCat.get(c.category) ?? 0) + monthlyEquiv(c.amount, c.frequency));
  }
  const catRows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sorties"
        title="Dépenses"
        description="Où part l'argent de RIXZA. Dépenses ponctuelles + coûts récurrents, ventilés par catégorie. Les coûts annuels/trimestriels sont ramenés au mois."
      />

      <Card>
        <CardHeader title={`Ce mois — ${last.month}`} />
        <CardBody>
          <MetricGrid columns={4}>
            <Metric label="Charges totales" value={formatMoney(lastTotal, cur)} emphasis="hero" />
            <Metric
              label="Évolution"
              value={growth === null ? "—" : formatPct(growth, { signed: true })}
              sub="vs mois précédent"
            />
            <Metric label="Coûts fixes / mois" value={formatMoney(monthlyFixed, cur)} sub={`${activeRecurring.length} récurrents actifs`} />
            <Metric label="Coûts fixes / an" value={formatMoney(monthlyFixed * 12, cur, { compact: true })} />
          </MetricGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Par catégorie" hint={`Mois ${last.month}`} />
        <CardBody className="p-0">
          {catRows.length === 0 ? (
            <p className="p-5 text-sm text-ink-3">Aucune dépense ce mois-ci.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {catRows.map(([cat, amount]) => (
                  <tr key={cat} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 text-ink-2">{catLabel(cat)}</td>
                    <td className="num px-3 py-2.5 text-right font-medium">
                      {formatMoney(amount, cur)}
                    </td>
                    <td className="num px-5 py-2.5 text-right text-ink-3">
                      {lastTotal > 0 ? `${((amount / lastTotal) * 100).toFixed(0)} %` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {canEdit ? <ExpensesEditor initial={data} editable={canEdit} /> : null}
    </div>
  );
}
