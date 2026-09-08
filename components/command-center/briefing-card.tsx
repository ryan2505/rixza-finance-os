import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildBriefing } from "@/lib/finance/briefing";
import type { CommandCenterSnapshot } from "@/lib/finance/snapshot";
import { MethodDetails } from "./method";

const ratingTone = {
  Solide: "pos",
  Stable: "info",
  "À surveiller": "warn",
  "Sous tension": "neg",
} as const;

/** §30 AI BRIEFING slot — rule-based executive read until the AI layer lands. */
export function BriefingCard({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const briefing = buildBriefing(snapshot);

  return (
    <Card>
      <CardHeader
        title="Briefing"
        hint="Synthèse automatique de direction"
        action={<Badge tone={ratingTone[briefing.rating]}>Santé financière : {briefing.rating}</Badge>}
      />
      <CardBody className="space-y-3">
        <p className="text-sm font-medium text-ink">{briefing.headline}</p>
        <ul className="space-y-1.5">
          {briefing.lines.map((line) => (
            <li key={line} className="flex gap-2 text-sm text-ink-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <MethodDetails
          summary="Comment la note est déterminée"
          items={[
            { term: "Sous tension", def: "Autonomie < 3 mois." },
            { term: "À surveiller", def: "Autonomie < 6 mois." },
            { term: "Solide", def: "CA en croissance ET marge nette positive." },
            { term: "Stable", def: "Tous les autres cas." },
            { term: "Nature", def: "Synthèse fondée sur des règles (pas d'IA). Le module AI Intelligence la remplacera par une analyse rédigée." },
          ]}
        />
      </CardBody>
    </Card>
  );
}
