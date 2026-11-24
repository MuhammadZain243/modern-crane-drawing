export const SCHEMA_VERSION = 1;

const mm = (metres) => Math.round(metres * 1000);

export function calculateDimensions(inputs) {
  const spanMm = mm(inputs.spanM);

  return [
    {
      key: "spanMm",
      label: "Crane span",
      valueMm: spanMm,
      source: "input",
      note: "Provided span, converted from metres to millimetres.",
    },
    {
      key: "liftHeightMm",
      label: "Lifting height",
      valueMm: mm(inputs.liftHeightM),
      source: "input",
      note: "Provided lifting height, converted from metres to millimetres.",
    },
    {
      key: "endClearanceLeftMm",
      label: "Left end clearance",
      valueMm: inputs.endClearanceLeftMm,
      source: "input",
      note: "Provided input.",
    },
    {
      key: "endClearanceRightMm",
      label: "Right end clearance",
      valueMm: inputs.endClearanceRightMm,
      source: "input",
      note: "Provided input.",
    },
    {
      key: "girderDepthMm",
      label: "Estimated girder depth",
      valueMm: Math.round(spanMm / 20),
      source: "estimate",
      note: "Rule-of-thumb estimate: span divided by 20. Not verified for structural design.",
    },
  ];
}
