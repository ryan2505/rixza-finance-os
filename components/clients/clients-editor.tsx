"use client";

import Link from "next/link";
import { EditorShell } from "@/components/data/editor-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  Txt,
  Sel,
  DateField,
  AddBtn,
  RemoveBtn,
  Empty,
  replaceAt,
  uid,
  CHANNEL_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  SERVICE_OPTIONS,
} from "@/components/data/fields";
import type { ClientRecord, RixzaData, ServiceLine } from "@/lib/finance/types";

function blankClient(): ClientRecord {
  return {
    id: uid("client"),
    name: "",
    country: "",
    channel: "outbound",
    services: [],
    startDate: null,
    renewalDate: null,
    status: "active",
  };
}

export function ClientsEditor({
  initial,
  editable,
}: {
  initial: RixzaData;
  editable: boolean;
}) {
  return (
    <EditorShell initial={initial} editable={editable}>
      {({ data, update }) => {
        const clients = data.clients;
        const set = (next: ClientRecord[]) => update({ clients: next });

        return (
          <Card>
            <CardHeader
              title="Clients"
              hint={`${clients.length} client${clients.length > 1 ? "s" : ""}`}
              action={
                <AddBtn onClick={() => set([...clients, blankClient()])} label="+ Client" />
              }
            />
            <CardBody className="space-y-4">
              {clients.length === 0 ? <Empty>Aucun client enregistré.</Empty> : null}
              {clients.map((c, i) => (
                <div key={c.id} className="rounded-md border border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    {c.name ? (
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        {c.name} →
                      </Link>
                    ) : (
                      <span className="text-xs text-ink-3">Nouveau client</span>
                    )}
                    <RemoveBtn onClick={() => set(clients.filter((_, j) => j !== i))} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Txt
                      label="Nom"
                      value={c.name}
                      onChange={(v) => set(replaceAt(clients, i, { ...c, name: v }))}
                    />
                    <Txt
                      label="Pays"
                      value={c.country}
                      onChange={(v) => set(replaceAt(clients, i, { ...c, country: v }))}
                    />
                    <Sel
                      label="Canal d'acquisition"
                      value={c.channel}
                      options={CHANNEL_OPTIONS}
                      onChange={(v) =>
                        set(replaceAt(clients, i, { ...c, channel: v as ClientRecord["channel"] }))
                      }
                    />
                    <Sel
                      label="Statut"
                      value={c.status}
                      options={CLIENT_STATUS_OPTIONS}
                      onChange={(v) =>
                        set(replaceAt(clients, i, { ...c, status: v as ClientRecord["status"] }))
                      }
                    />
                    <DateField
                      label="Date de début"
                      value={c.startDate ?? ""}
                      onChange={(v) =>
                        set(replaceAt(clients, i, { ...c, startDate: v || null }))
                      }
                    />
                    <DateField
                      label="Renouvellement"
                      value={c.renewalDate ?? ""}
                      onChange={(v) =>
                        set(replaceAt(clients, i, { ...c, renewalDate: v || null }))
                      }
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {SERVICE_OPTIONS.map((opt) => {
                      const on = c.services.includes(opt.value as ServiceLine);
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-1.5 text-xs text-ink-2"
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => {
                              const services = e.target.checked
                                ? [...c.services, opt.value as ServiceLine]
                                : c.services.filter((s) => s !== opt.value);
                              set(replaceAt(clients, i, { ...c, services }));
                            }}
                            className="size-3.5 rounded border-border accent-[var(--accent)]"
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        );
      }}
    </EditorShell>
  );
}
