"use client";

import { useState } from "react";
import Link from "next/link";

const ACTIONS = [
  { label: "Nouvelle facture", href: "/invoices" },
  { label: "Nouveau paiement", href: "/invoices" },
  { label: "Nouvelle dépense", href: "/expenses" },
  { label: "Nouveau client", href: "/clients" },
  { label: "Nouvel abonnement", href: "/data" },
  { label: "Nouveau revenu ponctuel", href: "/data" },
] as const;

export function QuickAdd() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ajouter"
        onClick={() => setOpen((v) => !v)}
        className="flex size-7 items-center justify-center rounded-md bg-accent text-base font-medium leading-none text-accent-fg hover:bg-accent-hover"
      >
        +
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-[var(--shadow-card)]">
            {ACTIONS.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-1.5 text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
