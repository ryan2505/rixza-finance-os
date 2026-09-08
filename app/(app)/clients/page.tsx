import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientsEditor } from "@/components/clients/clients-editor";
import { getStore } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials } from "@/lib/auth/config";
import { formatMoney } from "@/lib/finance/format";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const [data, dataset, user] = await Promise.all([
    getStore().getData(),
    getStore().getDataset(),
    getCurrentUser(),
  ]);
  const canEdit = canEditFinancials(user?.role);
  const cur = dataset.company.baseCurrency;

  const rows = [...dataset.clients].sort((a, b) => b.mrr - a.mrr || b.totalRevenue - a.totalRevenue);
  const totalMrr = rows.reduce((a, c) => a + c.mrr, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrées"
        title="Clients"
        description="Fiche financière par client : chiffre d'affaires, MRR, ARR, impayés. Cliquez un client pour son détail."
      />

      <Card>
        <CardHeader
          title="Portefeuille"
          hint={`${rows.length} client${rows.length > 1 ? "s" : ""} · MRR total ${formatMoney(totalMrr, cur)}`}
        />
        <CardBody className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="p-5 text-sm text-ink-3">
              Aucun client. Ajoutez vos clients ci-dessous.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">Client</th>
                  <th className="px-3 py-2.5 font-medium">Pays</th>
                  <th className="px-3 py-2.5 text-right font-medium">MRR</th>
                  <th className="px-3 py-2.5 text-right font-medium">ARR</th>
                  <th className="px-3 py-2.5 text-right font-medium">CA cumulé</th>
                  <th className="px-3 py-2.5 text-right font-medium">Impayés</th>
                  <th className="px-3 py-2.5 text-right font-medium">Part MRR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.client.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/clients/${c.client.id}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {c.client.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">{c.client.country || "—"}</td>
                    <td className="num px-3 py-2.5 text-right">{formatMoney(c.mrr, cur)}</td>
                    <td className="num px-3 py-2.5 text-right text-ink-2">
                      {formatMoney(c.mrr * 12, cur, { compact: true })}
                    </td>
                    <td className="num px-3 py-2.5 text-right text-ink-2">
                      {formatMoney(c.totalRevenue, cur)}
                    </td>
                    <td className="num px-3 py-2.5 text-right">
                      {c.outstanding > 0 ? (
                        <span className="text-warn">{formatMoney(c.outstanding, cur)}</span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    <td className="num px-3 py-2.5 text-right text-ink-3">
                      {totalMrr > 0 ? `${((c.mrr / totalMrr) * 100).toFixed(0)} %` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {canEdit ? (
        <ClientsEditor initial={data} editable={canEdit} />
      ) : (
        <Badge tone="neutral">Lecture seule</Badge>
      )}
    </div>
  );
}
