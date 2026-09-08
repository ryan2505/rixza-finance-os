type ClassValue = string | number | false | null | undefined;

/** Minimal className joiner — no dependency, no Tailwind merge magic. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
