"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "./nav-items";
import { Badge } from "@/components/ui/badge";
import { QuickAdd } from "./quick-add";

export function Topbar({
  companyName,
  dataStore,
  userName,
  roleLabel,
  canEdit,
}: {
  companyName: string;
  dataStore: "Supabase" | "Local";
  userName: string | null;
  roleLabel: string | null;
  canEdit: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const current =
    navItems.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ??
    "RIXZA Finance OS";

  const initials = (userName ?? "RX")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/85 px-5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-accent-fg lg:hidden">
          R
        </span>
        <span className="text-sm font-medium text-ink">{current}</span>
      </div>
      <div className="flex items-center gap-2.5">
        {canEdit ? <QuickAdd /> : null}
        <Badge tone={dataStore === "Supabase" ? "pos" : "neutral"}>{dataStore}</Badge>
        <span className="hidden text-xs text-ink-3 sm:inline">{companyName}</span>
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2"
            title={userName ?? undefined}
          >
            {initials}
          </span>
          {roleLabel ? (
            <span className="hidden text-[11px] text-ink-3 md:inline">
              {userName} · {roleLabel}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-60"
        >
          {signingOut ? "…" : "Se déconnecter"}
        </button>
      </div>
    </header>
  );
}
