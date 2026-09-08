import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthScore } from "@/lib/finance/health";

const statusTone = {
  Solide: "pos",
  Correct: "info",
  Fragile: "warn",
  Critique: "neg",
} as const;

function barTone(score: number): string {
  if (score >= 70) return "bg-pos";
  if (score >= 45) return "bg-warn";
  return "bg-neg";
}

/** §35 — RIXZA Financial Health Score. Shows the score and every component. */
export function HealthCard({ health }: { health: HealthScore | null }) {
  if (!health) {
    return (
      <Card>
        <CardHeader title="Score de santé financière" hint="Master prompt §35" />
        <CardBody>
          <p className="text-sm text-ink-3">
            Renseignez vos données pour calculer le score (0–100).
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Score de santé financière"
        hint="9 composantes pondérées · 0–100"
        action={<Badge tone={statusTone[health.status]}>{health.status}</Badge>}
      />
      <CardBody className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="metric-value text-4xl font-semibold text-ink">{health.score}</span>
          <span className="text-sm text-ink-3">/ 100</span>
        </div>

        <ul className="space-y-2.5">
          {health.components.map((c) => (
            <li key={c.label} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-medium text-ink-2">
                  {c.label}
                  <span className="ml-1.5 text-ink-3">({c.weight})</span>
                </span>
                <span className="num text-ink-3">{c.score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className={`h-full rounded-full ${barTone(c.score)}`}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-3">{c.note}</p>
            </li>
          ))}
        </ul>

        <p className="border-t border-border pt-3 text-[11px] text-ink-3">
          Score = Σ(composante × poids) ÷ Σ poids. Le score ne masque jamais les
          composantes sous-jacentes.
        </p>
      </CardBody>
    </Card>
  );
}
