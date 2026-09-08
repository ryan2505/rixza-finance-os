import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatMoney } from "@/lib/finance/format";
import type { CommandCenterSnapshot } from "@/lib/finance/snapshot";
import { cn } from "@/lib/utils";
import { MethodDetails } from "./method";

/** Cascade du MRR : Début → Nouveau / Expansion / Contraction / Attrition → Fin. */
export function MrrWaterfall({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const r = snapshot.recurring;
  const cur = snapshot.currency;

  const steps: { label: string; amount: number; kind: "base" | "up" | "down" | "total" }[] = [
    { label: "MRR de début", amount: r.startingMrr, kind: "base" },
    { label: "Nouveau", amount: r.newMrr, kind: "up" },
    { label: "Expansion", amount: r.expansion, kind: "up" },
    { label: "Contraction", amount: -r.contraction, kind: "down" },
    { label: "Attrition", amount: -r.churned, kind: "down" },
    { label: "MRR de fin", amount: r.endingMrr.value, kind: "total" },
  ];

  return (
    <Card>
      <CardHeader
        title="Cascade du MRR"
        hint={`MRR net nouveau ${formatMoney(r.netNewMrr, cur)} ce mois-ci`}
      />
      <CardBody>
        <ul className="space-y-1.5">
          {steps.map((s) => (
            <li
              key={s.label}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                s.kind === "base" && "bg-surface-2 text-ink-2",
                s.kind === "total" && "bg-accent-soft font-semibold text-accent",
                (s.kind === "up" || s.kind === "down") && "text-ink",
              )}
            >
              <span>{s.label}</span>
              <span
                className={cn(
                  "num font-medium",
                  s.kind === "up" && "text-pos",
                  s.kind === "down" && "text-neg",
                )}
              >
                {s.kind === "up" ? "+" : ""}
                {formatMoney(s.amount, cur)}
              </span>
            </li>
          ))}
        </ul>
        <MethodDetails
          summary="Ce que montre cette cascade"
          items={[
            { term: "MRR de début", def: "MRR atteint à la fin du mois précédent." },
            { term: "Nouveau", def: "MRR ajouté par les nouveaux clients / contrats du mois." },
            { term: "Expansion", def: "Hausse de MRR sur des clients existants (montée en gamme, volume)." },
            { term: "Contraction", def: "Baisse de MRR sur des clients existants (retenue en négatif)." },
            { term: "Attrition", def: "MRR perdu par des clients qui résilient (retenue en négatif)." },
            { term: "MRR de fin", def: "Début + Nouveau + Expansion − Contraction − Attrition." },
          ]}
        />
      </CardBody>
    </Card>
  );
}
