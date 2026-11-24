import { Link } from "react-router-dom";

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-muted px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className="mt-0.5 block text-sm font-extrabold text-ink">{value}</span>
    </div>
  );
}

export default function DesignList({ designs }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {designs.map((design) => (
        <li key={design.id}>
          <Link
            to={`/designs/${design.id}`}
            className="card-shadow group flex h-full flex-col rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-tint text-lg text-brand">
                ↗
              </span>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-bold text-ink-soft">
                FEM {design.inputs.dutyGroup}
              </span>
            </div>
            <h2 className="mt-4 line-clamp-2 text-lg font-extrabold tracking-tight text-ink group-hover:text-brand-strong">
              {design.name}
            </h2>
            <p className="mt-1 text-xs text-ink-faint">Updated {design.updatedLabel}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Metric label="Capacity" value={`${design.inputs.capacityT} t`} />
              <Metric label="Span" value={`${design.inputs.spanM} m`} />
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-brand">
              Open design <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}