import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dot } from "@/components/ui/badge";
import type { Alert, AlertLevel } from "@/lib/finance/snapshot";
import { MethodDetails } from "./method";

const tone: Record<AlertLevel, "neg" | "warn" | "pos" | "info"> = {
  danger: "neg",
  warning: "warn",
  success: "pos",
  info: "info",
};

/** Alertes, classées du plus grave au plus favorable. */
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const ordered = [...alerts].sort(
    (a, b) => rank(a.level) - rank(b.level),
  );

  return (
    <Card>
      <CardHeader title="Alertes" hint={`${alerts.length} active${alerts.length > 1 ? "s" : ""}`} />
      <CardBody>
        {ordered.length === 0 ? (
          <p className="text-sm text-ink-3">Rien ne nécessite votre attention.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ordered.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-1.5">
                  <Dot tone={tone[a.level]} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  {a.detail ? <p className="text-xs text-ink-2">{a.detail}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <MethodDetails
          summary="Règles de déclenchement"
          items={[
            { term: "Autonomie < 3 mois", def: "Rouge. Trésorerie ÷ burn net moyen sous 3." },
            { term: "Autonomie < 6 mois", def: "Orange. Idem sous 6." },
            { term: "Facture en retard", def: "Rouge. Au moins une facture au statut « en retard »." },
            { term: "Budget dépassé", def: "Orange. Sur le mois courant, réel > budget pour une ligne." },
            { term: "Charges > CA", def: "Orange. Croissance des charges sur un mois supérieure à celle du CA." },
            { term: "CA en hausse", def: "Vert. Croissance du CA positive sur le mois." },
          ]}
        />
      </CardBody>
    </Card>
  );
}

function rank(level: AlertLevel): number {
  return { danger: 0, warning: 1, info: 2, success: 3 }[level];
}
