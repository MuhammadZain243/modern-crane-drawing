function formatValue(value) {
  return `${Number(value).toLocaleString()} mm`;
}

export default function DimensionTable({ dimensions = [] }) {
  if (!dimensions.length) {
    return (
      <div className="rounded-2xl bg-surface-muted p-5 text-sm text-ink-soft">
        Enter valid requirements to see calculated dimensions.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="grid grid-cols-[1fr_auto] gap-3 bg-surface-muted px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-faint">
        <span>Dimension</span>
        <span>Value</span>
      </div>
      <ul className="divide-y divide-line bg-surface">
        {dimensions.map((dimension) => (
          <li key={dimension.key} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{dimension.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-ink-faint">{dimension.note}</span>
            </span>
            <span className="text-right">
              <span className="block whitespace-nowrap text-sm font-extrabold tabular-nums text-ink">
                {formatValue(dimension.valueMm)}
              </span>
              {dimension.source === "estimate" ? (
                <span className="mt-1 inline-flex rounded-full bg-estimate-tint px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-estimate-ink">
                  Estimate
                </span>
              ) : (
                <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Input
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}