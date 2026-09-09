import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabaseDataConfigured } from "@/lib/supabase/data-env";
import { getStore } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  canEditFinancials,
  getLocalUsers,
  ROLE_LABELS,
} from "@/lib/auth/config";
import { CATALOGUE } from "@/lib/finance/catalogue";
import { SERVICE_OPTIONS } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/format";

export const metadata = { title: "Réglages" };

const catLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;
const KIND_LABEL: Record<string, string> = {
  product: "Produit",
  system: "System",
  addon: "Add-on",
};

export default async function SettingsPage() {
  const [dataset, user] = await Promise.all([
    getStore().getDataset(),
    getCurrentUser(),
  ]);
  const accounts = getLocalUsers();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Système"
        title="Réglages"
        description="Espace de travail, devise de reporting, source des données et contrôle d'accès par rôle."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Session" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Utilisateur" value={user?.name ?? "—"} />
            <Row label="E-mail" value={user?.email ?? "—"} />
            <Row
              label="Rôle"
              value={
                user ? (
                  <Badge tone={canEditFinancials(user.role) ? "accent" : "neutral"}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                ) : (
                  "—"
                )
              }
            />
            <Row
              label="Saisie des données"
              value={
                canEditFinancials(user?.role)
                  ? "Autorisée (écrans dédiés)"
                  : "Lecture seule"
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Espace de travail" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Entreprise" value={dataset.company.name} />
            <Row label="Devise de reporting" value={`${dataset.company.baseCurrency} (FCFA)`} />
            <Row
              label="Source des données"
              value={
                <Badge tone={supabaseDataConfigured ? "pos" : "neutral"}>
                  {supabaseDataConfigured ? "Supabase (JSONB)" : "Fichier local (dev)"}
                </Badge>
              }
            />
            <Row label="Devises prises en charge" value="XAF · EUR · USD · CAD · GBP" />
            <Row label="Mois d'historique saisis" value={String(dataset.months.length)} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Comptes & rôles"
          hint="Définis via APP_AUTH_USERS (ou comptes par défaut)"
        />
        <CardBody>
          <ul className="divide-y divide-border text-sm">
            {accounts.map((a) => (
              <li
                key={a.email}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div>
                  <span className="font-medium text-ink">{a.email}</span>
                  <span className="ml-2 text-ink-3">{a.name}</span>
                </div>
                <Badge tone={canEditFinancials(a.role) ? "accent" : "neutral"}>
                  {ROLE_LABELS[a.role]}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-xs text-ink-3">
            Seuls les rôles <span className="font-medium text-ink-2">Propriétaire</span>,{" "}
            <span className="font-medium text-ink-2">Administrateur</span> et{" "}
            <span className="font-medium text-ink-2">Finance</span> peuvent saisir ou
            modifier les données financières (écran Données). Les autres rôles ont un
            accès en lecture seule au tableau de bord.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Catalogue RIXZA — Pricing V2"
          hint="Prix recommandés (FCFA). Sert à pré-remplir les montants à la saisie."
        />
        <CardBody className="max-h-[28rem] overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border text-left text-xs text-ink-3">
                <th className="px-5 py-2 font-medium">Offre</th>
                <th className="px-3 py-2 font-medium">Catégorie</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-5 py-2 text-right font-medium">Prix V2</th>
              </tr>
            </thead>
            <tbody>
              {CATALOGUE.map((it) => (
                <tr key={it.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2 font-medium text-ink">
                    {it.name}
                    {it.note ? (
                      <span className="ml-2 text-xs font-normal text-ink-3">{it.note}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-ink-2">{catLabel(it.category)}</td>
                  <td className="px-3 py-2 text-ink-3">{KIND_LABEL[it.kind]}</td>
                  <td className="num px-5 py-2 text-right">
                    {it.price === 0
                      ? "Gratuit"
                      : formatMoney(it.price, "XAF", { compact: it.price >= 1_000_000 })}
                    {it.priceMax
                      ? `–${formatMoney(it.priceMax, "XAF", { compact: true })}`
                      : ""}
                    {it.recurring ? "/mois" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-ink-3">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
