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

export const metadata = { title: "Réglages" };

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
