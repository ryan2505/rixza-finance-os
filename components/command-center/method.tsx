export interface MethodItem {
  /** What is shown (a metric name). */
  term: string;
  /** Exactly how it is computed, in plain French. */
  def: string;
}

/**
 * Collapsible "how this is calculated" panel. Native <details> — no JS.
 * Placed at the foot of a dashboard block so every number is auditable.
 */
export function MethodDetails({
  items,
  summary = "Comment ce bloc est calculé",
}: {
  items: MethodItem[];
  summary?: string;
}) {
  return (
    <details className="group mt-4 border-t border-border pt-3 text-xs">
      <summary className="cursor-pointer list-none font-medium text-ink-3 marker:content-none hover:text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="grid size-4 place-items-center rounded-full border border-border-strong text-[10px] leading-none transition-transform group-open:rotate-45"
            aria-hidden
          >
            +
          </span>
          {summary}
        </span>
      </summary>
      <dl className="mt-2.5 space-y-1.5">
        {items.map((it) => (
          <div key={it.term} className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[9rem_1fr]">
            <dt className="font-medium text-ink-2">{it.term}</dt>
            <dd className="num text-ink-3">{it.def}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
