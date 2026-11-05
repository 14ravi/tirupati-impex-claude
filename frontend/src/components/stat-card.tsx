export function StatCard({ label, value, hint }: { label: string; value?: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <StatValue value={value} />
      {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A big number, or a loading bar while `value` is undefined. */
export function StatValue({ value }: { value?: number | string }) {
  if (value === undefined) {
    return <div className="mt-1.5 h-7 w-12 animate-pulse rounded bg-subtle" aria-label="Loading" />;
  }
  // Dates and other text get a smaller size than counts, so they fit narrow cards.
  const size = typeof value === "string" ? "mt-1.5 text-lg" : "mt-1 text-2xl";
  return <p className={`${size} truncate font-semibold tabular-nums`}>{value}</p>;
}
