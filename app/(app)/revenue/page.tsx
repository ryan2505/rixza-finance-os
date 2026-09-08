import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Delta } from "@/components/ui/delta";
import { Sparkline } from "@/components/ui/sparkline";
import { getStore } from "@/lib/data";
import { buildSnapshot } from "@/lib/finance/snapshot";
import { formatMoney, formatMonthLabel } from "@/lib/finance/format";
import { SERVICE_OPTIONS } from "@/lib/finance/labels";

export const metadata = { title: "Chiffre d'affaires" };

const serviceLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default async function RevenuePage() {
  const [data, dataset] = await Promise.all([
    getStore().getData(),
    getStore().getDataset(),
  ]);
  const s = buildSnapshot(dataset);
  const cur = dataset.company.baseCurrency;

  const months = dataset.months;
  const revSeries = s.series.revenue;
  const year = months[months.length - 1].month.slice(0, 4);
  const yearRevenue = months
    .filter((m) => m.month.startsWith(year))
    .reduce((a, m) => a + m.recurringRevenue + m.oneTimeRevenue, 0);

  // by type
  const recTotal = months.reduce((a, m) => a + m.recurringRevenue, 0);
  const oneTimeTotal = months.reduce((a, m) => a + m.oneTimeRevenue, 0);

  // by client
  const byClient = [...dataset.clients]
    .map((c) => ({ name: c.client.name, total: c.totalRevenue }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // by service (one-time bookings) + recurring bucket
  const byService = new Map<string, number>();
  for (const r of data.revenueRecords) {
    const key = r.service ?? "autre";
    byService.set(key, (byService.get(key) ?? 0) + r.amount);
  }
  const serviceRows = [...byService.entries()].sort((a, b) => b[1] - a[1]);

  // by country
  const byCountry = new Map<string, number>();
  for (const c of dataset.clients) {
    const key = c.client.country || "—";
    byCountry.set(key, (byCountry.get(key) ?? 0) + c.totalRevenue);
  }
  const countryRows = [...byCountry.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  const windowTotal = revSeries.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrées"
        title="Chiffre d'affaires"
        description="D'où vient l'argent de RIXZA — par mois, par client, par service, par pays, par type."
      />

      <Card>
        <CardHeader
          title="Vue d'ensemble"
          action={<Sparkline data={revSeries} width={140} height={40} />}
        />
        <CardBody>
          <MetricGrid columns={4}>
            <Metric
              label="CA du mois"
              value={formatMoney(s.revenue.mtd.value, cur)}
              sub={<Delta value={s.revenue.mtd.changePct} />}
              emphasis="hero"
            />
            <Metric label="Trimestre" value={formatMoney(s.revenue.quarter, cur)} />
            <Metric label="Cumul annuel" value={formatMoney(s.revenue.ytd, cur)} />
            <Metric label={`Année ${year}`} value={formatMoney(yearRevenue, cur)} />
          </MetricGrid>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Par type" hint={`Fenêtre ${months.length} mois`} />
          <CardBody className="p-0">
            <Row2 label="Récurrent (MRR reconnu)" value={formatMoney(recTotal, cur)} pct={windowTotal ? (recTotal / windowTotal) * 100 : 0} />
            <Row2 label="Ponctuel (projets)" value={formatMoney(oneTimeTotal, cur)} pct={windowTotal ? (oneTimeTotal / windowTotal) * 100 : 0} last />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Par mois" />
          <CardBody className="p-0">
            {months.map((m) => (
              <Row2
                key={m.month}
                label={formatMonthLabel(m.month, "long")}
                value={formatMoney(m.recurringRevenue + m.oneTimeRevenue, cur)}
              />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Par client" hint={`${byClient.length}`} />
          <CardBody className="p-0">
            {byClient.length === 0 ? (
              <p className="p-5 text-sm text-ink-3">Aucun revenu client.</p>
            ) : (
              byClient.map((c, i) => (
                <Row2
                  key={c.name}
                  label={c.name}
                  value={formatMoney(c.total, cur)}
                  pct={windowTotal ? (c.total / windowTotal) * 100 : 0}
                  last={i === byClient.length - 1}
                />
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Par service (ponctuel)" />
          <CardBody className="p-0">
            {serviceRows.length === 0 ? (
              <p className="p-5 text-sm text-ink-3">Aucun revenu ponctuel.</p>
            ) : (
              serviceRows.map(([k, v], i) => (
                <Row2
                  key={k}
                  label={k === "autre" ? "Autre" : serviceLabel(k)}
                  value={formatMoney(v, cur)}
                  last={i === serviceRows.length - 1}
                />
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Par pays" />
          <CardBody className="p-0">
            {countryRows.length === 0 ? (
              <p className="p-5 text-sm text-ink-3">Aucune donnée.</p>
            ) : (
              countryRows.map(([k, v], i) => (
                <Row2 key={k} label={k} value={formatMoney(v, cur)} last={i === countryRows.length - 1} />
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row2({
  label,
  value,
  pct,
  last,
}: {
  label: string;
  value: string;
  pct?: number;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-2.5 text-sm ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-ink-2">{label}</span>
      <span className="flex items-baseline gap-2">
        {pct !== undefined ? (
          <span className="num text-xs text-ink-3">{pct.toFixed(0)} %</span>
        ) : null}
        <span className="num font-medium text-ink">{value}</span>
      </span>
    </div>
  );
}
