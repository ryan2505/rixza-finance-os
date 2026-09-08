"use client";

import { EditorShell } from "@/components/data/editor-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  Txt,
  Num,
  Sel,
  DateField,
  Check,
  AddBtn,
  RemoveBtn,
  Empty,
  replaceAt,
  uid,
  EXPENSE_CATEGORY_OPTIONS,
  FREQ_OPTIONS,
  PLAN_STATUS_OPTIONS,
} from "@/components/data/fields";
import type { ExpenseRecord, RecurringCostRecord, RixzaData } from "@/lib/finance/types";

const today = () => new Date().toISOString().slice(0, 10);

export function ExpensesEditor({
  initial,
  editable,
}: {
  initial: RixzaData;
  editable: boolean;
}) {
  return (
    <EditorShell initial={initial} editable={editable}>
      {({ data, update }) => {
        const expenses = data.expenses;
        const recurring = data.recurringCosts;
        const setExp = (n: ExpenseRecord[]) => update({ expenses: n });
        const setRec = (n: RecurringCostRecord[]) => update({ recurringCosts: n });

        const blankExpense = (): ExpenseRecord => ({
          id: uid("exp"),
          vendorName: "",
          category: "operations",
          description: "",
          amount: 0,
          spentOn: today(),
          isCogs: false,
        });
        const blankRecurring = (): RecurringCostRecord => ({
          id: uid("rc"),
          vendorName: "",
          label: "",
          category: "software",
          amount: 0,
          frequency: "monthly",
          startDate: today(),
          endDate: null,
          isCogs: false,
          status: "active",
        });

        return (
          <>
            <Card>
              <CardHeader
                title="Dépenses ponctuelles"
                hint={`${expenses.length}`}
                action={<AddBtn onClick={() => setExp([blankExpense(), ...expenses])} label="+ Dépense" />}
              />
              <CardBody className="space-y-3">
                {expenses.length === 0 ? <Empty>Aucune dépense.</Empty> : null}
                {expenses.map((e, i) => (
                  <div
                    key={e.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Txt
                      label="Description"
                      value={e.description}
                      onChange={(v) => setExp(replaceAt(expenses, i, { ...e, description: v }))}
                    />
                    <Txt
                      label="Fournisseur"
                      value={e.vendorName}
                      onChange={(v) => setExp(replaceAt(expenses, i, { ...e, vendorName: v }))}
                    />
                    <Sel
                      label="Catégorie"
                      value={e.category}
                      options={EXPENSE_CATEGORY_OPTIONS}
                      onChange={(v) =>
                        setExp(replaceAt(expenses, i, { ...e, category: v as ExpenseRecord["category"] }))
                      }
                    />
                    <Num
                      label="Montant"
                      value={e.amount}
                      onChange={(v) => setExp(replaceAt(expenses, i, { ...e, amount: v }))}
                    />
                    <DateField
                      label="Date"
                      value={e.spentOn}
                      onChange={(v) => setExp(replaceAt(expenses, i, { ...e, spentOn: v }))}
                    />
                    <Check
                      label="Coût direct (COGS)"
                      checked={e.isCogs}
                      onChange={(v) => setExp(replaceAt(expenses, i, { ...e, isCogs: v }))}
                    />
                    <div className="flex items-end lg:col-span-2">
                      <RemoveBtn onClick={() => setExp(expenses.filter((_, j) => j !== i))} />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Coûts récurrents"
                hint={`${recurring.length}`}
                action={<AddBtn onClick={() => setRec([blankRecurring(), ...recurring])} label="+ Coût récurrent" />}
              />
              <CardBody className="space-y-3">
                {recurring.length === 0 ? <Empty>Aucun coût récurrent.</Empty> : null}
                {recurring.map((c, i) => (
                  <div
                    key={c.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Txt
                      label="Libellé"
                      value={c.label}
                      onChange={(v) => setRec(replaceAt(recurring, i, { ...c, label: v }))}
                    />
                    <Sel
                      label="Catégorie"
                      value={c.category}
                      options={EXPENSE_CATEGORY_OPTIONS}
                      onChange={(v) =>
                        setRec(replaceAt(recurring, i, { ...c, category: v as RecurringCostRecord["category"] }))
                      }
                    />
                    <Num
                      label="Montant"
                      value={c.amount}
                      onChange={(v) => setRec(replaceAt(recurring, i, { ...c, amount: v }))}
                    />
                    <Sel
                      label="Fréquence"
                      value={c.frequency}
                      options={FREQ_OPTIONS}
                      onChange={(v) =>
                        setRec(replaceAt(recurring, i, { ...c, frequency: v as RecurringCostRecord["frequency"] }))
                      }
                    />
                    <DateField
                      label="Début"
                      value={c.startDate}
                      onChange={(v) => setRec(replaceAt(recurring, i, { ...c, startDate: v }))}
                    />
                    <DateField
                      label="Fin (option)"
                      value={c.endDate ?? ""}
                      onChange={(v) => setRec(replaceAt(recurring, i, { ...c, endDate: v || null }))}
                    />
                    <Sel
                      label="Statut"
                      value={c.status}
                      options={PLAN_STATUS_OPTIONS}
                      onChange={(v) =>
                        setRec(replaceAt(recurring, i, { ...c, status: v as RecurringCostRecord["status"] }))
                      }
                    />
                    <div className="flex items-end justify-between gap-2">
                      <Check
                        label="COGS"
                        checked={c.isCogs}
                        onChange={(v) => setRec(replaceAt(recurring, i, { ...c, isCogs: v }))}
                      />
                      <RemoveBtn onClick={() => setRec(recurring.filter((_, j) => j !== i))} />
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
