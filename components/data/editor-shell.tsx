"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { RixzaData } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

interface RenderArgs {
  data: RixzaData;
  /** Merge a partial update into the working copy. */
  update: (patch: Partial<RixzaData>) => void;
  editable: boolean;
}

/**
 * Wraps a record editor: holds the working copy of RixzaData, renders a
 * sticky save/reset bar, and PUTs the whole object to /api/dataset.
 * Every CRUD screen shares this.
 */
export function EditorShell({
  initial,
  editable,
  children,
  resettable = false,
}: {
  initial: RixzaData;
  editable: boolean;
  resettable?: boolean;
  children: (args: RenderArgs) => ReactNode;
}) {
  const router = useRouter();
  const [data, setData] = useState<RixzaData>(() => structuredClone(initial));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const update = useCallback((patch: Partial<RixzaData>) => {
    setData((d) => ({ ...d, ...patch }));
    setDirty(true);
    setMsg(null);
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dataset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; data?: RixzaData }
        | null;
      if (!res.ok) {
        setMsg({
          tone: "err",
          text:
            res.status === 401
              ? "Session expirée — reconnectez-vous."
              : res.status === 403
                ? "Votre rôle ne permet pas de modifier les données."
                : body?.error ?? "Enregistrement impossible.",
        });
        return;
      }
      if (body?.data) setData(structuredClone(body.data));
      setDirty(false);
      setMsg({ tone: "ok", text: "Enregistré. Le Command Center est à jour." });
      router.refresh();
    } catch {
      setMsg({ tone: "err", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm("Tout remettre à zéro ? Toutes les données seront effacées.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dataset", { method: "DELETE" });
      if (res.ok) {
        const g = await fetch("/api/dataset");
        const body = (await g.json()) as { data: RixzaData };
        setData(structuredClone(body.data));
        setDirty(false);
        setMsg({ tone: "ok", text: "Données remises à zéro." });
        router.refresh();
      } else {
        setMsg({ tone: "err", text: "Réinitialisation impossible." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("space-y-6", !editable && "pointer-events-none opacity-60")}>
      {children({ data, update, editable })}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving || !editable || !dirty}
          className="h-9 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
        </button>
        {resettable ? (
          <button
            type="button"
            onClick={reset}
            disabled={saving || !editable}
            className="h-9 rounded-md border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-60"
          >
            Tout remettre à zéro
          </button>
        ) : null}
        {msg ? (
          <span className={cn("text-sm", msg.tone === "ok" ? "text-pos" : "text-neg")}>
            {msg.text}
          </span>
        ) : null}
        {!editable ? (
          <span className="text-sm text-ink-3">
            Lecture seule — votre rôle ne permet pas la saisie.
          </span>
        ) : null}
      </div>
    </div>
  );
}
