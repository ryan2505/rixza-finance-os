"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-60";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-ink-3">{label}</span>
      {children}
    </label>
  );
}

export function Txt({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

export function Num({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="decimal"
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className={cn(inputCls, "num")}
      />
    </Field>
  );
}

export function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type="date"
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, "num")}
      />
    </Field>
  );
}

export function Sel({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="mt-5 flex items-center gap-2 text-xs font-medium text-ink-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

export function AddBtn({ onClick, label = "+ Ajouter" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      {label}
    </button>
  );
}

export function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-neg hover:bg-neg-soft"
    >
      Supprimer
    </button>
  );
}

export function Empty({ children = "Aucune ligne. Utilisez « + Ajouter »." }: { children?: ReactNode }) {
  return <p className="text-sm text-ink-3">{children}</p>;
}

/** Immutable array replace. */
export function replaceAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Option lists live in a plain module so Server Components can use them too.
export {
  CURRENCY_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  EXPENSE_CATEGORY_OPTIONS,
  CHANNEL_OPTIONS,
  SERVICE_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  PLAN_STATUS_OPTIONS,
  FREQ_OPTIONS,
  METHOD_OPTIONS,
  BUDGET_GROUP_OPTIONS,
  GOAL_METRIC_OPTIONS,
} from "@/lib/finance/labels";
