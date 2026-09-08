import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Badge } from "@/components/ui/badge";
import { InvoicesEditor } from "@/components/invoices/invoices-editor";
import { getStore } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials } from "@/lib/auth/config";
import { formatMoney, formatDate } from "@/lib/finance/format";
import { INVOICE_STATUS_OPTIONS } from "@/lib/finance/labels";

export const metadata = { title: "Factures" };

const statusLabel = (v: string) => INVOICE_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default async function InvoicesPage() {
  const [data, dataset, user] = await Promise.all([
    getStore().getData(),
    getStore().getDataset(),
    getCurrentUser(),
  ]);
  const canEdit = canEditFinancials(user?.role);
  const cur = dataset.company.baseCurrency;
  const clientName = (id: string) =>
    dataset.clients.find((c) => c.client.id === id)?.client.name ?? "—";

  const inv = dataset.invoices; // statuses already promoted to "overdue" where due
  const settled = inv.filter((i) => i.status !== "draft" && i.status !== "cancelled");
  const totalInvoiced = settled.reduce((a, i) => a + i.amount, 0);
  const paid = inv.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0);
  const pending = inv.filter((i) => i.status === "sent" || i.status === "pending").reduce((a, i) => a + i.amount, 0);
  const overdue = inv.filter((i) => i.status === "overdue").reduce((a, i) => a + i.amount, 0);
  const collected = data.payments.reduce((a, p) => a + p.amount, 0);

  const rows = [...inv].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrées"
        title="Factures"
        description="Registre des factures et des paiements. Les factures échues non réglées passent automatiquement « en retard »."
      />

      <Card>
        <CardHeader title="Comptes clients (créances)" />
        <CardBody>
          <MetricGrid columns={5}>
            <Metric label="Total facturé" value={formatMoney(totalInvoiced, cur)} emphasis="hero" />
            <Metric label="Encaissé" value={formatMoney(collected, cur)} />
            <Metric label="Payé (factures)" value={formatMoney(paid, cur)} />
            <Metric label="En attente" value={formatMoney(pending, cur)} />
            <Metric
              label="En retard"
              value={formatMoney(overdue, cur)}
              sub={overdue > 0 ? "à recouvrer en priorité" : undefined}
            />
          </MetricGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Toutes les factures" hint={`${rows.length}`} />
        <CardBody className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="p-5 text-sm text-ink-3">Aucune facture. Créez-en une ci-dessous.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">N°</th>
                  <th className="px-3 py-2.5 font-medium">Client</th>
                  <th className="px-3 py-2.5 text-right font-medium">Montant</th>
                  <th className="px-3 py-2.5 font-medium">Émission</th>
                  <th className="px-3 py-2.5 font-medium">Échéance</th>
                  <th className="px-5 py-2.5 text-right font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink">{i.number}</td>
                    <td className="px-3 py-2.5 text-ink-2">{clientName(i.clientId)}</td>
                    <td className="num px-3 py-2.5 text-right">{formatMoney(i.amount, cur)}</td>
                    <td className="px-3 py-2.5 text-ink-3">{formatDate(i.issueDate)}</td>
                    <td className="px-3 py-2.5 text-ink-3">{formatDate(i.dueDate)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <Badge
                        tone={
                          i.status === "paid"
                            ? "pos"
                            : i.status === "overdue"
                              ? "neg"
                              : i.status === "cancelled"
                                ? "neutral"
                                : "warn"
                        }
                      >
                        {statusLabel(i.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {canEdit ? <InvoicesEditor initial={data} editable={canEdit} /> : null}
    </div>
  );
}
