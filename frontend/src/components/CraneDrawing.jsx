import { createDrawingModel } from "../services/drawingService.js";

function DimensionLine({ x1, x2, y, label, vertical = false }) {
  const start = vertical ? { x1: x1, y1: y, x2: x1, y2: x2 } : { x1, y1: y, x2, y2: y };
  const labelX = vertical ? x1 + 8 : (x1 + x2) / 2;
  const labelY = vertical ? (y + x2) / 2 : y - 7;
  return (
    <g className="fill-brand stroke-brand" strokeWidth="1.5">
      <line {...start} />
      {vertical ? (
        <>
          <path d={`M ${x1 - 4} ${y + 6} L ${x1} ${y} L ${x1 + 4} ${y + 6}`} />
          <path d={`M ${x1 - 4} ${x2 - 6} L ${x1} ${x2} L ${x1 + 4} ${x2 - 6}`} />
        </>
      ) : (
        <>
          <path d={`M ${x1 + 6} ${y - 4} L ${x1} ${y} L ${x1 + 6} ${y + 4}`} />
          <path d={`M ${x2 - 6} ${y - 4} L ${x2} ${y} L ${x2 - 6} ${y + 4}`} />
        </>
      )}
      <text
        x={labelX}
        y={labelY}
        textAnchor={vertical ? "start" : "middle"}
        className="fill-ink-soft stroke-none text-[10px] font-bold"
      >
        {label}
      </text>
    </g>
  );
}

function PlanView({ model }) {
  const { leftX, rightX, trolleyX } = model;
  return (
    <svg viewBox="0 0 760 118" role="img" aria-label="Schematic crane plan view" className="w-full">
      <rect x={leftX} y="35" width={rightX - leftX} height="20" rx="4" fill="var(--drawing-rail)" stroke="var(--brand)" strokeWidth="2" />
      <rect x={leftX - 18} y="29" width="18" height="32" rx="3" fill="var(--ink)" />
      <rect x={rightX} y="29" width="18" height="32" rx="3" fill="var(--ink)" />
      <rect x={trolleyX - 23} y="26" width="46" height="38" rx="8" fill="var(--accent)" stroke="var(--estimate-ink)" strokeWidth="2" />
      <DimensionLine x1={leftX} x2={rightX} y="92" label={`Span ${model.spanLabel}`} />
      <text x="106" y="18" className="fill-ink-faint text-[9px] font-bold">END CARRIAGE</text>
      <text x={trolleyX} y="79" textAnchor="middle" className="fill-ink-faint text-[9px] font-bold">TROLLEY</text>
    </svg>
  );
}

function ElevationView({ model }) {
  const { leftX, rightX, girderY, girderHeight, baseline, hoistY, trolleyX } = model;
  const hoistX = trolleyX;
  return (
    <svg viewBox="0 0 760 310" role="img" aria-label="Schematic crane elevation view" className="w-full">
      <line x1="65" y1={baseline} x2="690" y2={baseline} stroke="var(--line)" strokeDasharray="5 5" />
      <rect x={leftX} y={girderY} width={rightX - leftX} height={girderHeight} rx="3" fill="var(--brand)" />
      <rect x={leftX - 18} y={girderY + girderHeight} width="30" height="15" rx="3" fill="var(--ink)" />
      <rect x={rightX - 12} y={girderY + girderHeight} width="30" height="15" rx="3" fill="var(--ink)" />
      <rect x={hoistX - 20} y={girderY + girderHeight} width="40" height="22" rx="6" fill="var(--accent)" stroke="var(--estimate-ink)" />
      <line x1={hoistX} y1={girderY + girderHeight + 22} x2={hoistX} y2={hoistY} stroke="var(--ink-soft)" strokeWidth="3" />
      <path d={`M ${hoistX - 7} ${hoistY} Q ${hoistX} ${hoistY + 10} ${hoistX + 7} ${hoistY}`} fill="none" stroke="var(--ink)" strokeWidth="3" />
      <DimensionLine x1={leftX} x2={rightX} y="202" label={`Span ${model.spanLabel}`} />
      <DimensionLine x1="680" x2={baseline} y={girderY} label={model.liftLabel} vertical />
      <text x={leftX} y="280" className="fill-ink-faint text-[9px] font-semibold">RAIL LEVEL · SCHEMATIC</text>
      <text x={hoistX + 25} y={hoistY - 5} className="fill-ink-faint text-[9px] font-bold">HOOK</text>
      <text x={leftX} y="297" className="fill-ink-soft text-[9px] font-semibold">
        End clearances · left {model.leftLabel} · right {model.rightLabel}
      </text>
    </svg>
  );
}

function EndView({ model }) {
  return (
    <svg viewBox="0 0 280 210" role="img" aria-label="Schematic crane end view" className="w-full">
      <rect x="68" y="68" width="144" height={model.girderHeight + 25} rx="5" fill="var(--drawing-rail)" stroke="var(--brand)" strokeWidth="2" />
      <rect x="56" y="102" width="24" height="35" rx="4" fill="var(--ink)" />
      <rect x="200" y="102" width="24" height="35" rx="4" fill="var(--ink)" />
      <rect x="118" y="111" width="44" height="30" rx="7" fill="var(--accent)" stroke="var(--estimate-ink)" />
      <DimensionLine x1="72" x2="212" y="174" label={`Depth ${model.depthLabel}`} />
      <text x="140" y="48" textAnchor="middle" className="fill-ink-faint text-[9px] font-bold">GIRDER</text>
    </svg>
  );
}

export default function CraneDrawing({ dimensions }) {
  if (!dimensions?.length) {
    return (
      <div className="drawing-grid rounded-3xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
        A drawing preview will appear when all inputs are within range.
      </div>
    );
  }
  const model = createDrawingModel(dimensions);
  return (
    <div className="space-y-5">
      <div className="drawing-grid overflow-hidden rounded-2xl border border-line bg-surface p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-faint">
            Schematic views
          </span>
          <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand-strong">
            Preliminary
          </span>
        </div>
        <div className="grid gap-3">
          {model.views.slice(0, 2).map((view) => (
            <section key={view.key} className="rounded-xl border border-line/80 bg-white/80 p-2 sm:p-3">
              <div className="flex items-center justify-between px-2 pt-1">
                <h3 className="text-xs font-extrabold text-ink">{view.title}</h3>
                <span className="text-[10px] text-ink-faint">{view.detail}</span>
              </div>
              {view.key === "plan" ? <PlanView model={model} /> : <ElevationView model={model} />}
            </section>
          ))}
          <section className="rounded-xl border border-line/80 bg-white/80 p-2 sm:p-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <h3 className="text-xs font-extrabold text-ink">End view</h3>
              <span className="text-[10px] text-ink-faint">Schematic</span>
            </div>
            <EndView model={model} />
          </section>
        </div>
      </div>
      <p className="text-center text-xs font-semibold text-ink-faint">
        Preliminary drawing · Not to scale · Not for manufacture
      </p>
    </div>
  );
}