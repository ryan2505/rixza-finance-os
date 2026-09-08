"use client";

import { EditorShell } from "@/components/data/editor-shell";
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
  INVOICE_STATUS_OPTIONS,
  METHOD_OPTIONS,
} from "@/components/data/fields";
import type { InvoiceRecord, PaymentRecord, RixzaData } from "@/lib/finance/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function InvoicesEditor({
  initial,
  editable,
}: {
  initial: RixzaData;
  editable: boolean;
}) {
  return (
    <EditorShell initial={initial} editable={editable}>
      {({ data, update }) => {
        const clientOptions = data.clients.map((c) => ({ value: c.id, label: c.name || c.id }));
        const invoices = data.invoices;
        const payments = data.payments;
        const setInv = (next: InvoiceRecord[]) => update({ invoices: next });
        const setPay = (next: PaymentRecord[]) => update({ payments: next });

        const nextNumber = () => {
          const year = new Date().getUTCFullYear();
          const n = invoices.filter((i) => i.number.includes(String(year))).length + 1;
          return `RIXZA-${year}-${String(n).padStart(3, "0")}`;
        };

        function blankInvoice(): InvoiceRecord {
          const issue = today();
          return {
            id: uid("inv"),
            number: nextNumber(),
            clientId: data.clients[0]?.id ?? "",
            issueDate: issue,
            dueDate: plusDays(issue, 15),
            status: "draft",
            currency: data.company.baseCurrency,
            amount: 0,
            exchangeRate: 1,
            note: "",
          };
        }
        function blankPayment(): PaymentRecord {
          return {
            id: uid("pay"),
            invoiceId: null,
            clientId: data.clients[0]?.id ?? "",
            paidOn: today(),
            amount: 0,
            method: "bank",
          };
        }

        return (
          <>
            <Card>
              <CardHeader
                title="Factures"
                hint={`${invoices.length} facture${invoices.length > 1 ? "s" : ""}`}
                action={
                  <AddBtn
                    onClick={() => setInv([blankInvoice(), ...invoices])}
                    label="+ Facture"
                  />
                }
              />
              <CardBody className="space-y-3">
                {invoices.length === 0 ? <Empty>Aucune facture.</Empty> : null}
                {invoices.map((inv, i) => (
                  <div
                    key={inv.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Txt
                      label="Numéro"
                      value={inv.number}
                      onChange={(v) => setInv(replaceAt(invoices, i, { ...inv, number: v }))}
                    />
                    <Sel
                      label="Client"
                      value={inv.clientId}
                      options={clientOptions.length ? clientOptions : [{ value: "", label: "— aucun —" }]}
                      onChange={(v) => setInv(replaceAt(invoices, i, { ...inv, clientId: v }))}
                    />
                    <Num
                      label="Montant"
                      value={inv.amount}
                      onChange={(v) => setInv(replaceAt(invoices, i, { ...inv, amount: v }))}
                    />
                    <Sel
                      label="Devise"
                      value={inv.currency}
                      options={CURRENCY_OPTIONS}
                      onChange={(v) =>
                        setInv(replaceAt(invoices, i, { ...inv, currency: v as InvoiceRecord["currency"] }))
                      }
                    />
                    <DateField
                      label="Émission"
                      value={inv.issueDate}
                      onChange={(v) => setInv(replaceAt(invoices, i, { ...inv, issueDate: v }))}
                    />
                    <DateField
                      label="Échéance"
                      value={inv.dueDate}
                      onChange={(v) => setInv(replaceAt(invoices, i, { ...inv, dueDate: v }))}
                    />
                    <Sel
                      label="Statut"
                      value={inv.status}
                      options={INVOICE_STATUS_OPTIONS}
                      onChange={(v) =>
                        setInv(replaceAt(invoices, i, { ...inv, status: v as InvoiceRecord["status"] }))
                      }
                    />
                    <div className="flex items-end justify-between gap-2">
                      {inv.currency !== data.company.baseCurrency ? (
                        <Num
                          label={`Taux → ${data.company.baseCurrency}`}
                          value={inv.exchangeRate}
                          onChange={(v) =>
                            setInv(replaceAt(invoices, i, { ...inv, exchangeRate: v || 1 }))
                          }
                        />
                      ) : (
                        <span className="text-[11px] text-ink-3">
                          {new Intl.NumberFormat("fr-FR").format(inv.amount)}{" "}
                          {data.company.baseCurrency}
                        </span>
                      )}
                      <RemoveBtn onClick={() => setInv(invoices.filter((_, j) => j !== i))} />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Paiements reçus"
                hint={`${payments.length} paiement${payments.length > 1 ? "s" : ""}`}
                action={
                  <AddBtn
                    onClick={() => setPay([blankPayment(), ...payments])}
                    label="+ Paiement"
                  />
                }
              />
              <CardBody className="space-y-3">
                {payments.length === 0 ? <Empty>Aucun paiement enregistré.</Empty> : null}
                {payments.map((p, i) => (
                  <div
                    key={p.id}
                    className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <DateField
                      label="Date"
                      value={p.paidOn}
                      onChange={(v) => setPay(replaceAt(payments, i, { ...p, paidOn: v }))}
                    />
                    <Sel
                      label="Client"
                      value={p.clientId}
                      options={clientOptions.length ? clientOptions : [{ value: "", label: "— aucun —" }]}
                      onChange={(v) => setPay(replaceAt(payments, i, { ...p, clientId: v }))}
                    />
                    <Sel
                      label="Facture (option)"
                      value={p.invoiceId ?? ""}
                      options={[
                        { value: "", label: "— aucune —" },
                        ...invoices
                          .filter((inv) => !p.clientId || inv.clientId === p.clientId)
                          .map((inv) => ({ value: inv.id, label: inv.number })),
                      ]}
                      onChange={(v) =>
                        setPay(replaceAt(payments, i, { ...p, invoiceId: v || null }))
                      }
                    />
                    <Num
                      label={`Montant (${data.company.baseCurrency})`}
                      value={p.amount}
                      onChange={(v) => setPay(replaceAt(payments, i, { ...p, amount: v }))}
                    />
                    <Sel
                      label="Moyen"
                      value={p.method}
                      options={METHOD_OPTIONS}
                      onChange={(v) =>
                        setPay(replaceAt(payments, i, { ...p, method: v as PaymentRecord["method"] }))
                      }
                    />
                    <div className="flex items-end">
                      <RemoveBtn onClick={() => setPay(payments.filter((_, j) => j !== i))} />
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
