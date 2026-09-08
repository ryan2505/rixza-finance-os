import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { MetricGrid } from "@/components/ui/metric";
import { MethodDetails, type MethodItem } from "./method";

/** A titled Command Center section: metric grid, optional sparkline, method panel. */
export function MetricSection({
  title,
  hint,
  columns = 3,
  spark,
  method,
  children,
}: {
  title: string;
  hint?: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  spark?: { data: number[]; tone?: "accent" | "pos" | "neg" | "ink" };
  method?: MethodItem[];
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        hint={hint}
        action={
          spark ? (
            <Sparkline data={spark.data} tone={spark.tone ?? "accent"} width={132} height={38} />
          ) : undefined
        }
      />
      <CardBody>
        <MetricGrid columns={columns}>{children}</MetricGrid>
        {method ? <MethodDetails items={method} /> : null}
      </CardBody>
    </Card>
  );
}
