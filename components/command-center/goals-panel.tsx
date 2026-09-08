import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatNumber, formatPct } from "@/lib/finance/format";
import type { CommandCenterSnapshot } from "@/lib/finance/snapshot";
import { MethodDetails } from "./method";

/** Objectifs — Actuel → Cible → Écart → Croissance mensuelle requise. */
export function GoalsPanel({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const cur = snapshot.currency;

  const render = (n: number, metric: string) =>
    metric === "clients" ? formatNumber(n) : formatMoney(n, cur, { compact: true });

  return (
    <Card>
      <CardHeader title="Objectifs" hint="Progression vers les cibles" />
      <CardBody className="space-y-5">
        {snapshot.goals.length === 0 ? (
          <p className="text-sm text-ink-3">
            Aucun objectif défini. Ajoutez-en depuis l'écran Données.
          </p>
        ) : (
          snapshot.goals.map(({ goal, progressPct, gap, requiredMonthlyGrowthPct, monthsRemaining }) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{goal.label}</span>
                <span className="num text-xs text-ink-3">
                  {formatPct(progressPct, { decimals: 1 })}
                </span>
              </div>
              <Progress
                value={progressPct}
                tone={progressPct !== null && progressPct >= 100 ? "pos" : "accent"}
              />
              <div className="num flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
                <span>Actuel {render(goal.current, goal.metric)}</span>
                <span>Cible {render(goal.target, goal.metric)}</span>
                <span>Écart {render(Math.max(gap, 0), goal.metric)}</span>
                <span>
                  Requis{" "}
                  {requiredMonthlyGrowthPct === null
                    ? "—"
                    : `${formatPct(requiredMonthlyGrowthPct, { decimals: 1 })}/mois`}{" "}
                  sur {monthsRemaining} mois
                </span>
              </div>
            </div>
          ))
        )}
        {snapshot.goals.length > 0 ? (
          <MethodDetails
            summary="Comment ces objectifs sont suivis"
            items={[
              { term: "Progression", def: "Valeur actuelle ÷ cible × 100." },
              { term: "Écart", def: "Cible − valeur actuelle (ramené à 0 si dépassé)." },
              { term: "Mois restants", def: "Nombre de mois entre le mois affiché et la date cible." },
              { term: "Croissance requise", def: "(cible ÷ actuel) ^ (1 ÷ mois restants) − 1, exprimée en % par mois." },
            ]}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
