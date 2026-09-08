import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditFinancials, ROLE_LABELS } from "@/lib/auth/config";
import { getStore } from "@/lib/data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, dataset] = await Promise.all([
    getCurrentUser(),
    getStore().getDataset(),
  ]);
  const canEdit = canEditFinancials(user?.role);

  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar canEdit={canEdit} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          companyName={dataset.company.name}
          supabaseConfigured={supabaseConfigured}
          userName={user?.name ?? null}
          roleLabel={user ? ROLE_LABELS[user.role].split(" — ")[0] : null}
          canEdit={canEdit}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
