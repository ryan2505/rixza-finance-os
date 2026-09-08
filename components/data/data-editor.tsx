"use client";

import { EditorShell } from "./editor-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  Txt,
  Num,
  Sel,
  DateField,
  AddBtn,
  RemoveBtn,
  Empty,
  replaceAt,
  uid,
  CURRENCY_OPTIONS,
  PLAN_STATUS_OPTIONS,
  SERVICE_OPTIONS,
  BUDGET_GROUP_OPTIONS,
  GOAL_METRIC_OPTIONS,
} from "./fields";
import type {
  BudgetTarget,
  FinancialGoal,
  RevenueRecord,
  RixzaData,
  Subscription,
} from "@/lib/finance/types";

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export function DataEditor({
  initial,
  editable,
}: {
  initial: RixzaData;
  editable: boolean;
}) {
  return (
    <EditorShell initial={initial} editable={editable} resettable>
      {({ data, update }) => {
        const clientOptions = data.clients.map((c) => ({ value: c.id, label: c.name || c.id }));
        const subs = data.subscriptions;
        const revs = data.revenueRecords;
        const budgets = data.budgetTargets;
        const goals = data.goals;

        return (
          <>
            {/* Entreprise */}
            <Card>
              <CardHeader title="Entreprise" hint="Identité, devise, trésorerie de départ" />
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Txt
                  label="Nom"
                  value={data.company.name}
                  onChange={(v) => update({ company: { ...data.company, name: v } })}
                />
                <Sel
                  label="Devise de référence"
                  value={data.company.baseCurrency}
                  options={CURRENCY_OPTIONS}
                  onChange={(v) =>
                    update({
                      company: {
                        ...data.company,
                        baseCurrency: v as RixzaData["company"]["baseCurrency"],
                      },
                    })
                  }
                />
                <Num
                  label="Trésorerie d'ouverture"
                  value={data.company.openingCash}
                  onChange={(v) => update({ company: { ...data.company, openingCash: v } })}
                />
                <DateField
                  label="À la date du"
                  value={data.company.openingCashDate}
                  onChange={(v) =>
                    update({ company: { ...data.company, openingCashDate: v } })
                  }
                />
              </CardBody>
            </Card>

            {/* Abonnements (MRR) */}
            <Card>
              <CardHeader
                title="Abonnements — MRR"
                hint="Chaque abonnement actif alimente le MRR du mois où il court"
                action={
                  <AddBtn
                    label="+ Abonnement"
                    onClick={() =>
                      update({
                        subscriptions: [
                          {
                            id: uid("sub"),
                            clientId: data.clients[0]?.id ?? "",
                            label: "Abonnement",
                            amountPerMonth: 0,
                            startDate: today(),
                            endDate: null,
                            status: "active",
                          },
                          ...subs,
                        ],
                      })
                    }
                  />
                }
              />
              <CardBody className="space-y-3">
                {subs.length === 0 ? <Empty>Aucun abonnement.</Empty> : null}
                {subs.map((s, i) => (
                  <div
                    key={s.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Sel
                      label="Client"
                      value={s.clientId}
                      options={clientOptions.length ? clientOptions : [{ value: "", label: "— aucun —" }]}
                      onChange={(v) =>
                        update({ subscriptions: replaceAt(subs, i, { ...s, clientId: v }) })
                      }
                    />
                    <Txt
                      label="Libellé"
                      value={s.label}
                      onChange={(v) =>
                        update({ subscriptions: replaceAt(subs, i, { ...s, label: v }) })
                      }
                    />
                    <Num
                      label="Montant / mois"
                      value={s.amountPerMonth}
                      onChange={(v) =>
                        update({ subscriptions: replaceAt(subs, i, { ...s, amountPerMonth: v }) })
                      }
                    />
                    <Sel
                      label="Statut"
                      value={s.status}
                      options={PLAN_STATUS_OPTIONS}
                      onChange={(v) =>
                        update({
                          subscriptions: replaceAt(subs, i, {
                            ...s,
                            status: v as Subscription["status"],
                          }),
                        })
                      }
                    />
                    <DateField
                      label="Début"
                      value={s.startDate}
                      onChange={(v) =>
                        update({ subscriptions: replaceAt(subs, i, { ...s, startDate: v }) })
                      }
                    />
                    <DateField
                      label="Fin (option)"
                      value={s.endDate ?? ""}
                      onChange={(v) =>
                        update({
                          subscriptions: replaceAt(subs, i, { ...s, endDate: v || null }),
                        })
                      }
                    />
                    <div className="flex items-end lg:col-span-2">
                      <RemoveBtn
                        onClick={() =>
                          update({ subscriptions: subs.filter((_, j) => j !== i) })
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* Revenus ponctuels */}
            <Card>
              <CardHeader
                title="Revenus ponctuels"
                hint="Prestations et projets non récurrents"
                action={
                  <AddBtn
                    label="+ Revenu"
                    onClick={() =>
                      update({
                        revenueRecords: [
                          {
                            id: uid("rev"),
                            clientId: data.clients[0]?.id ?? "",
                            service: null,
                            bookedOn: today(),
                            amount: 0,
                            description: "",
                          },
                          ...revs,
                        ],
                      })
                    }
                  />
                }
              />
              <CardBody className="space-y-3">
                {revs.length === 0 ? <Empty>Aucun revenu ponctuel.</Empty> : null}
                {revs.map((r, i) => (
                  <div
                    key={r.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Sel
                      label="Client"
                      value={r.clientId}
                      options={clientOptions.length ? clientOptions : [{ value: "", label: "— aucun —" }]}
                      onChange={(v) =>
                        update({ revenueRecords: replaceAt(revs, i, { ...r, clientId: v }) })
                      }
                    />
                    <Sel
                      label="Service"
                      value={r.service ?? ""}
                      options={[{ value: "", label: "—" }, ...SERVICE_OPTIONS]}
                      onChange={(v) =>
                        update({
                          revenueRecords: replaceAt(revs, i, {
                            ...r,
                            service: (v || null) as RevenueRecord["service"],
                          }),
                        })
                      }
                    />
                    <Num
                      label="Montant"
                      value={r.amount}
                      onChange={(v) =>
                        update({ revenueRecords: replaceAt(revs, i, { ...r, amount: v }) })
                      }
                    />
                    <DateField
                      label="Date"
                      value={r.bookedOn}
                      onChange={(v) =>
                        update({ revenueRecords: replaceAt(revs, i, { ...r, bookedOn: v }) })
                      }
                    />
                    <Txt
                      label="Description"
                      value={r.description}
                      onChange={(v) =>
                        update({ revenueRecords: replaceAt(revs, i, { ...r, description: v }) })
                      }
                    />
                    <div className="flex items-end">
                      <RemoveBtn
                        onClick={() =>
                          update({ revenueRecords: revs.filter((_, j) => j !== i) })
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* Budget */}
            <Card>
              <CardHeader
                title="Budget"
                hint="Cibles par mois et catégorie — le réel est calculé à partir des dépenses"
                action={
                  <AddBtn
                    label="+ Ligne"
                    onClick={() =>
                      update({
                        budgetTargets: [
                          ...budgets,
                          { month: thisMonth(), group: "operations", label: "", budget: 0 },
                        ],
                      })
                    }
                  />
                }
              />
              <CardBody className="space-y-3">
                {budgets.length === 0 ? <Empty>Aucune ligne de budget.</Empty> : null}
                {budgets.map((b, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Txt
                      label="Mois (AAAA-MM)"
                      value={b.month}
                      onChange={(v) =>
                        update({ budgetTargets: replaceAt(budgets, i, { ...b, month: v }) })
                      }
                    />
                    <Sel
                      label="Catégorie"
                      value={b.group}
                      options={BUDGET_GROUP_OPTIONS}
                      onChange={(v) =>
                        update({
                          budgetTargets: replaceAt(budgets, i, {
                            ...b,
                            group: v as BudgetTarget["group"],
                          }),
                        })
                      }
                    />
                    <Txt
                      label="Libellé"
                      value={b.label}
                      onChange={(v) =>
                        update({ budgetTargets: replaceAt(budgets, i, { ...b, label: v }) })
                      }
                    />
                    <div className="flex items-end gap-2">
                      <Num
                        label="Budget"
                        value={b.budget}
                        onChange={(v) =>
                          update({ budgetTargets: replaceAt(budgets, i, { ...b, budget: v }) })
                        }
                      />
                      <div className="flex items-end">
                        <RemoveBtn
                          onClick={() =>
                            update({ budgetTargets: budgets.filter((_, j) => j !== i) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* Objectifs */}
            <Card>
              <CardHeader
                title="Objectifs financiers"
                hint="La valeur actuelle est calculée automatiquement"
                action={
                  <AddBtn
                    label="+ Objectif"
                    onClick={() =>
                      update({
                        goals: [
                          ...goals,
                          {
                            id: uid("goal"),
                            label: "",
                            metric: "arr",
                            target: 0,
                            targetDate: today(),
                            current: 0,
                          },
                        ],
                      })
                    }
                  />
                }
              />
              <CardBody className="space-y-3">
                {goals.length === 0 ? <Empty>Aucun objectif.</Empty> : null}
                {goals.map((g, i) => (
                  <div
                    key={g.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Txt
                      label="Libellé"
                      value={g.label}
                      onChange={(v) =>
                        update({ goals: replaceAt(goals, i, { ...g, label: v }) })
                      }
                    />
                    <Sel
                      label="Indicateur"
                      value={g.metric}
                      options={GOAL_METRIC_OPTIONS}
                      onChange={(v) =>
                        update({
                          goals: replaceAt(goals, i, {
                            ...g,
                            metric: v as FinancialGoal["metric"],
                          }),
                        })
                      }
                    />
                    <Num
                      label="Cible"
                      value={g.target}
                      onChange={(v) =>
                        update({ goals: replaceAt(goals, i, { ...g, target: v }) })
                      }
                    />
                    <div className="flex items-end gap-2">
                      <DateField
                        label="Date cible"
                        value={g.targetDate}
                        onChange={(v) =>
                          update({ goals: replaceAt(goals, i, { ...g, targetDate: v }) })
                        }
                      />
                      <div className="flex items-end">
                        <RemoveBtn
                          onClick={() =>
                            update({ goals: goals.filter((_, j) => j !== i) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </>
        );
      }}
    </EditorShell>
  );
}
