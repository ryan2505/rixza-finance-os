import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataEditor } from "@/components/data/data-editor";
import { getStore } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials } from "@/lib/auth/config";

export const metadata = { title: "Données" };

export default async function DataPage() {
  const [data, user] = await Promise.all([getStore().getData(), getCurrentUser()]);

  if (!canEditFinancials(user?.role)) {
    redirect("/command-center");
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Système"
        title="Données financières"
        description="Entreprise, abonnements (MRR), revenus ponctuels, budget et objectifs. Les clients, factures, paiements et dépenses se saisissent sur leurs écrans dédiés. Tout est modifiable à tout moment."
      />
      <DataEditor initial={data} editable />
    </div>
  );
}
