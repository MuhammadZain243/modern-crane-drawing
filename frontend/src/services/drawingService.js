const dimensionMap = (dimensions = []) =>
  Object.fromEntries(dimensions.map((item) => [item.key, item.valueMm]));

const formatMm = (value) => `${Number(value).toLocaleString()} mm`;

export function createDrawingModel(dimensions = []) {
  const values = dimensionMap(dimensions);
  const span = values.spanMm || 0;
  const lift = values.liftHeightMm || 0;
  const left = values.endClearanceLeftMm || 0;
  const right = values.endClearanceRightMm || 0;
  const depth = values.girderDepthMm || 0;
  const baseline = 254;
  const scale = span > 0 ? Math.min(560 / span, 0.022) : 0;
  const leftX = 105;
  const rightX = leftX + span * scale;
  const girderY = 146;
  const hoistHeight = Math.max(50, Math.min(105, lift * 0.012));
  const girderHeight = Math.max(12, Math.min(30, depth * 0.012));

  return {
    spanLabel: formatMm(span),
    liftLabel: formatMm(lift),
    leftLabel: formatMm(left),
    rightLabel: formatMm(right),
    depthLabel: formatMm(depth),
    leftX,
    rightX,
    girderY,
    baseline,
    girderHeight,
    hoistY: girderY + girderHeight + hoistHeight,
    trolleyX: leftX + (rightX - leftX) * 0.55,
    scale,
    views: [
      { key: "plan", title: "Plan", detail: "Top view" },
      { key: "elevation", title: "Elevation", detail: "Side view" },
      { key: "end", title: "End view", detail: "Schematic" },
    ],
  };
}
