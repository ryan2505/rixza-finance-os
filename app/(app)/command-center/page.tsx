import { PageHeader } from "@/components/ui/page-header";
import { Metric } from "@/components/ui/metric";
import { Delta } from "@/components/ui/delta";
import { Badge } from "@/components/ui/badge";
import { MetricSection } from "@/components/command-center/metric-section";
import { ExecutiveStrip } from "@/components/command-center/executive-strip";
import { PerformanceStrip } from "@/components/command-center/performance-strip";
import { BriefingCard } from "@/components/command-center/briefing-card";
import { AlertsPanel } from "@/components/command-center/alerts-panel";
import { MrrWaterfall } from "@/components/command-center/mrr-waterfall";
import { GoalsPanel } from "@/components/command-center/goals-panel";
import { HealthCard } from "@/components/command-center/health-card";
import { getStore } from "@/lib/data";
import { buildSnapshot } from "@/lib/finance/snapshot";
import { buildHealthScore } from "@/lib/finance/health";
import { formatMoney, formatMonths, formatPct } from "@/lib/finance/format";

export const metadata = { title: "Command Center" };

export default async function CommandCenterPage() {
  const dataset = await getStore().getDataset();
  const s = buildSnapshot(dataset, { forecastHorizonMonths: 3 });
  const health = buildHealthScore(s, dataset);
  const cur = s.currency;
  const hasData =
    s.revenue.mtd.value !== 0 ||
    s.recurring.endingMrr.value !== 0 ||
    s.cash.balance !== 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title="RIXZA Command Center"
        description="L'état financier de RIXZA en un coup d'œil — chiffre d'affaires, revenus récurrents, rentabilité, trésorerie et prévision. Chaque bloc peut être déplié pour voir exactement ce qui est calculé."
        action={<Badge tone="accent">{s.monthLabel}</Badge>}
      />

      {!hasData ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface-2 px-5 py-4 text-sm text-ink-2">
          Aucune donnée financière saisie pour l'instant. Ouvrez{" "}
          <span className="font-medium text-ink">Données</span> dans le menu pour
          renseigner les chiffres réels de RIXZA — le tableau de bord se remplira
          aussitôt.
        </div>
      ) : null}

      <ExecutiveStrip snapshot={s} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <MetricSection
            title="Chiffre d'affaires"
            hint="Ce que RIXZA a facturé / généré sur le mois affiché"
            columns={3}
            spark={{ data: s.series.revenue }}
            method={[
              { term: "CA du mois", def: "CA récurrent du mois + CA ponctuel du mois." },
              { term: "Trimestre", def: "Somme du CA des 3 derniers mois." },
              { term: "Cumul annuel", def: "Somme du CA des mois de l'année civile en cours." },
              { term: "Mois précédent", def: "CA total du mois qui précède le mois affiché." },
              { term: "Année précédente", def: "CA du même mois, un an plus tôt (— si absent de l'historique)." },
              { term: "Δ vs mois préc.", def: "(valeur − valeur précédente) ÷ |valeur précédente| × 100." },
              { term: "Part récurrente", def: "CA récurrent du mois ÷ CA total du mois × 100." },
            ]}
          >
            <Metric
              label="CA du mois"
              value={formatMoney(s.revenue.mtd.value, cur)}
              sub={<Delta value={s.revenue.mtd.changePct} />}
              emphasis="hero"
            />
            <Metric label="Trimestre" value={formatMoney(s.revenue.quarter, cur)} />
            <Metric label="Cumul annuel" value={formatMoney(s.revenue.ytd, cur)} />
            <Metric label="Mois précédent" value={formatMoney(s.revenue.mtd.previous, cur)} />
            <Metric label="Année précédente" value={formatMoney(s.revenue.previousYear, cur)} />
            <Metric
              label="Part récurrente"
              value={formatPct(s.revenue.recurringShare, { decimals: 0 })}
            />
          </MetricSection>

          <div className="grid gap-6 md:grid-cols-2">
            <MetricSection
              title="Revenus récurrents"
              hint="Revenu mensuel qui se répète (abonnements, forfaits, régies)"
              columns={2}
              spark={{ data: s.series.mrr }}
              method={[
                { term: "MRR (fin de mois)", def: "MRR de début + Nouveau + Expansion − Contraction − Attrition, cumulé mois après mois." },
                { term: "MRR de début", def: "MRR de fin − MRR net nouveau." },
                { term: "MRR net nouveau", def: "Nouveau + Expansion − Contraction − Attrition (sur le mois)." },
                { term: "ARR", def: "MRR de fin de mois × 12." },
              ]}
            >
              <Metric
                label="MRR"
                value={formatMoney(s.recurring.endingMrr.value, cur)}
                sub={<Delta value={s.recurring.endingMrr.changePct} />}
                emphasis="hero"
              />
              <Metric label="ARR" value={formatMoney(s.recurring.arr, cur, { compact: true })} />
              <Metric label="MRR net nouveau" value={formatMoney(s.recurring.netNewMrr, cur)} />
              <Metric label="MRR de début" value={formatMoney(s.recurring.startingMrr, cur)} />
            </MetricSection>

            <MrrWaterfall snapshot={s} />
          </div>

          <MetricSection
            title="Rentabilité"
            hint="Compte de résultat simplifié du mois affiché"
            columns={3}
            spark={{ data: s.series.netProfit, tone: "pos" }}
            method={[
              { term: "Marge brute", def: "CA − Coûts directs (COGS)." },
              { term: "Charges d'exploitation", def: "Salaires, freelances, outils, marketing, bureau… (hors coûts directs et taxes)." },
              { term: "Résultat net", def: "Marge brute − Charges d'exploitation − Taxes & autres." },
              { term: "Taux de marge brute", def: "Marge brute ÷ CA × 100." },
              { term: "Taux de marge nette", def: "Résultat net ÷ CA × 100." },
            ]}
          >
            <Metric label="CA (brut)" value={formatMoney(s.profitability.grossRevenue, cur)} />
            <Metric label="Marge brute" value={formatMoney(s.profitability.grossProfit, cur)} />
            <Metric
              label="Charges d'exploitation"
              value={formatMoney(s.profitability.operatingExpenses, cur)}
            />
            <Metric
              label="Résultat net"
              value={formatMoney(s.profitability.netProfit.value, cur)}
              sub={<Delta value={s.profitability.netProfit.changePct} />}
            />
            <Metric label="Taux de marge brute" value={formatPct(s.profitability.grossMargin)} />
            <Metric label="Taux de marge nette" value={formatPct(s.profitability.netMargin)} />
          </MetricSection>

          <MetricSection
            title="Trésorerie"
            hint="Position de caisse et rythme de consommation"
            columns={3}
            spark={{ data: s.series.cashBalance, tone: "ink" }}
            method={[
              { term: "Flux de trésorerie net", def: "Encaissements − Décaissements (sur le mois)." },
              { term: "Charges totales", def: "Coûts directs + Charges d'exploitation + Taxes & autres." },
              { term: "Burn net", def: "max(Charges totales − CA, 0), moyenné sur les 3 derniers mois." },
              { term: "Autonomie (runway)", def: "Solde de trésorerie ÷ Burn net moyen. « ∞ » si CA ≥ charges (pas de consommation)." },
            ]}
          >
            <Metric
              label="Solde de trésorerie"
              value={formatMoney(s.cash.balance, cur)}
              emphasis="hero"
            />
            <Metric label="Encaissements" value={formatMoney(s.cash.cashIn, cur)} />
            <Metric label="Décaissements" value={formatMoney(s.cash.cashOut, cur)} />
            <Metric label="Flux de trésorerie net" value={formatMoney(s.cash.netCashFlow, cur)} />
            <Metric
              label="Burn net"
              value={formatMoney(s.cash.burnRate, cur)}
              sub="moyenne / mois"
            />
            <Metric
              label="Autonomie"
              value={formatMonths(s.cash.runwayMonths)}
              sub={
                s.cash.runwayMonths !== null && s.cash.runwayMonths < 6
                  ? "sous les 6 mois"
                  : undefined
              }
            />
          </MetricSection>

          <MetricSection
            title="Prévision"
            hint={`${s.forecast.horizonMonths} prochains mois · projection par tendance linéaire`}
            columns={3}
            method={[
              { term: "Méthode", def: "Régression linéaire (moindres carrés) sur l'historique mensuel, prolongée sur les mois à venir. Valeurs négatives ramenées à 0." },
              { term: "CA / charges prévus", def: "Somme des mois projetés sur l'horizon." },
              { term: "Résultat prévu", def: "CA prévu − charges prévues." },
              { term: "Trésorerie prévue", def: "Solde actuel + somme des flux de trésorerie nets projetés." },
              { term: "MRR prévu", def: "Dernier point de la droite de tendance du MRR. ARR prévu = MRR prévu × 12." },
            ]}
          >
            <Metric label="CA prévu" value={formatMoney(s.forecast.revenue, cur)} />
            <Metric label="Charges prévues" value={formatMoney(s.forecast.expenses, cur)} />
            <Metric label="Résultat prévu" value={formatMoney(s.forecast.profit, cur)} />
            <Metric label="Trésorerie prévue" value={formatMoney(s.forecast.cash, cur)} />
            <Metric label="MRR prévu" value={formatMoney(s.forecast.endingMrr, cur)} />
            <Metric
              label="ARR prévu"
              value={formatMoney(s.forecast.arr, cur, { compact: true })}
            />
          </MetricSection>
        </div>

        <div className="space-y-6">
          <HealthCard health={health} />
          <BriefingCard snapshot={s} />
          <AlertsPanel alerts={s.alerts} />
          <GoalsPanel snapshot={s} />
          <PerformanceStrip snapshot={s} />
        </div>
      </div>
    </div>
  );
}
