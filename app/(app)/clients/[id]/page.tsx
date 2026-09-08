import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import { getStore } from "@/lib/data";
import { formatMoney, formatDate, formatMonthLabel } from "@/lib/finance/format";
import { effectiveInvoiceStatus } from "@/lib/finance/derive";
import { SERVICE_OPTIONS, INVOICE_STATUS_OPTIONS } from "@/lib/finance/labels";

const serviceLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;
const statusLabel = (v: string) => INVOICE_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, dataset] = await Promise.all([
    getStore().getData(),
    getStore().getDataset(),
  ]);

  const record = data.clients.find((c) => c.id === id);
  const profile = dataset.clients.find((c) => c.client.id === id);
  if (!record || !profile) notFound();

  const cur = dataset.company.baseCurrency;
  const months = dataset.months.map((m) => m.month);
  const revSeries = months.map((m) => profile.revenueByMonth[m] ?? 0);

  const invoices = data.invoices
    .filter((i) => i.clientId === id)
    .map((i) => ({ ...i, eff: effectiveInvoiceStatus(i.status, i.dueDate) }))
    .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));

  const payments = data.payments
    .filter((p) => p.clientId === id)
    .sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1));

  // Financial health
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const delays = paidInvoices
    .map((inv) => {
      const pay = payments.find((p) => p.invoiceId === inv.id);
      if (!pay) return null;
      const d = Math.round(
        (Date.parse(pay.paidOn) - Date.parse(inv.dueDate)) / 86_400_000,
      );
      return d;
    })
    .filter((d): d is number => d !== null);
  const avgDelay = delays.length
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
    : null;
  const settled = invoices.filter((i) => i.eff !== "draft" && i.eff !== "cancelled");
  const reliability = settled.length
    ? Math.round((settled.filter((i) => i.status === "paid").length / settled.length) * 100)
    : null;
  const totalCompanyRevenue = dataset.clients.reduce((a, c) => a + c.totalRevenue, 0);
  const contribution = totalCompanyRevenue > 0
    ? Math.round((profile.totalRevenue / totalCompanyRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-3">
        <Link href="/clients" className="hover:text-ink">← Clients</Link>
      </div>

      <PageHeader
        eyebrow={record.country || "Client"}
        title={record.name}
        action={
          <Badge tone={record.status === "active" ? "pos" : record.status === "churned" ? "neg" : "neutral"}>
            {record.status === "active" ? "Actif" : record.status === "churned" ? "Perdu" : "Prospect"}
          </Badge>
        }
      />

      <Card>
        <CardHeader title="Synthèse" />
        <CardBody>
          <MetricGrid columns={5}>
            <Metric label="CA cumulé" value={formatMoney(profile.totalRevenue, cur)} emphasis="hero" />
            <Metric label="MRR" value={formatMoney(profile.mrr, cur)} />
            <Metric label="ARR" value={formatMoney(profile.mrr * 12, cur, { compact: true })} />
            <Metric label="Valeur vie (LTV)" value={formatMoney(profile.totalRevenue, cur)} sub="CA reconnu à ce jour" />
            <Metric
              label="Impayés"
              value={formatMoney(profile.outstanding, cur)}
              sub={profile.outstanding > 0 ? "à recouvrer" : undefined}
            />
          </MetricGrid>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Historique de revenu"
            hint="Récurrent + ponctuel, par mois"
            action={<Sparkline data={revSeries} width={140} height={40} />}
          />
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <tbody>
                {months.map((m) => (
                  <tr key={m} className="border-b border-border last:border-0">
                    <td className="px-5 py-2 text-ink-2">{formatMonthLabel(m, "long")}</td>
                    <td className="num px-5 py-2 text-right font-medium">
                      {formatMoney(profile.revenueByMonth[m] ?? 0, cur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Santé financière" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Fiabilité de paiement" value={reliability === null ? "—" : `${reliability} %`} />
            <Row
              label="Retard moyen"
              value={avgDelay === null ? "—" : avgDelay <= 0 ? "à l'heure" : `${avgDelay} j`}
            />
            <Row label="Part du CA de RIXZA" value={`${contribution} %`} />
            <Row label="Services" value={record.services.map(serviceLabel).join(", ") || "—"} />
            <Row
              label="Renouvellement"
              value={record.renewalDate ? formatDate(record.renewalDate) : "—"}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Factures" hint={`${invoices.length}`} />
          <CardBody className="overflow-x-auto p-0">
            {invoices.length === 0 ? (
              <p className="p-5 text-sm text-ink-3">Aucune facture.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 font-medium text-ink">{i.number}</td>
                      <td className="px-3 py-2 text-ink-3">{formatDate(i.issueDate)}</td>
                      <td className="num px-3 py-2 text-right">
                        {formatMoney(i.amount * (i.exchangeRate || 1), cur)}
                      </td>
                      <td className="px-5 py-2 text-right">
                        <StatusBadge status={i.eff} label={statusLabel(i.eff)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Paiements" hint={`${payments.length}`} />
          <CardBody className="overflow-x-auto p-0">
            {payments.length === 0 ? (
              <p className="p-5 text-sm text-ink-3">Aucun paiement.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 text-ink-2">{formatDate(p.paidOn)}</td>
                      <td className="px-3 py-2 text-ink-3">
                        {p.invoiceId
                          ? data.invoices.find((i) => i.id === p.invoiceId)?.number ?? "—"
                          : "—"}
                      </td>
                      <td className="num px-5 py-2 text-right font-medium text-pos">
                        {formatMoney(p.amount, cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2.5 last:border-0 last:pb-0">
      <span className="text-ink-3">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone: "pos" | "neg" | "neutral" | "warn" =
    status === "paid"
      ? "pos"
      : status === "overdue"
        ? "neg"
        : status === "cancelled"
          ? "neutral"
          : "warn";
  return <Badge tone={tone}>{label}</Badge>;
}
