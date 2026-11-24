import { api } from "../api/client.js";

const numericFields = [
  "capacityT",
  "spanM",
  "liftHeightM",
  "endClearanceLeftMm",
  "endClearanceRightMm",
];

export const emptyDesign = {
  name: "",
  capacityT: "10",
  spanM: "25",
  liftHeightM: "7.9",
  endClearanceLeftMm: "235",
  endClearanceRightMm: "235",
  dutyGroup: "A5",
};

function mapInputs(inputs) {
  return {
    name: inputs.name,
    capacityT: inputs.capacityT,
    spanM: inputs.spanM,
    liftHeightM: inputs.liftHeightM,
    endClearanceLeftMm: inputs.endClearanceLeftMm,
    endClearanceRightMm: inputs.endClearanceRightMm,
    dutyGroup: inputs.dutyGroup,
  };
}

export function mapDesign(design) {
  return {
    id: design.id,
    name: design.name,
    inputs: mapInputs(design.inputs),
    dimensions: design.dimensions,
    schemaVersion: design.schemaVersion,
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
    updatedLabel: new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(`${design.updatedAt.replace(" ", "T")}Z`)),
  };
}

export function mapDesignToForm(design) {
  const inputs = { ...design.inputs, name: design.name };
  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, String(value)]),
  );
}

export function mapConfig(config) {
  return {
    ranges: config.inputRanges,
    dutyGroups: config.dutyGroups,
  };
}

export function mapFormToPayload(form, config, { requireName = true } = {}) {
  const fields = {};
  const name = form.name.trim();
  if (requireName && !name) fields.name = "Enter a design name.";
  if (name.length > config.ranges.name.maxLength) {
    fields.name = `Use ${config.ranges.name.maxLength} characters or fewer.`;
  }

  const payload = {
    name: name || "Preview",
    dutyGroup: form.dutyGroup,
  };
  for (const key of numericFields) {
    const value = Number(form[key]);
    const range = config.ranges[key];
    if (!Number.isFinite(value)) {
      fields[key] = "Enter a valid number.";
      continue;
    }
    if (key.endsWith("Mm") && !Number.isInteger(value)) {
      fields[key] = "Enter a whole number in millimetres.";
      continue;
    }
    if (value < range.min || value > range.max) {
      fields[key] = `Use a value from ${range.min} to ${range.max}.`;
      continue;
    }
    payload[key] = value;
  }
  if (!config.dutyGroups.includes(form.dutyGroup)) {
    fields.dutyGroup = "Choose a listed duty group.";
  }
  return { payload, fields };
}

function ensureValid(form, config, options) {
  const result = mapFormToPayload(form, config, options);
  if (Object.keys(result.fields).length) {
    const error = new Error("Please correct the highlighted fields.");
    error.code = "VALIDATION_ERROR";
    error.fields = result.fields;
    throw error;
  }
  return result.payload;
}

export const designService = {
  async loadConfig() {
    return mapConfig(await api.getConfig());
  },
  async preview(form, config) {
    const inputs = ensureValid(form, config, { requireName: false });
    const result = await api.previewDesign(inputs);
    return result.dimensions;
  },
  async list({ limit = 20, offset = 0 } = {}) {
    const result = await api.listDesigns({ limit, offset });
    return {
      designs: result.designs.map(mapDesign),
      pagination: result.pagination,
    };
  },
  async get(id) {
    const result = await api.getDesign(id);
    return mapDesign(result.design);
  },
  async save(form, config, id) {
    const inputs = ensureValid(form, config);
    const result = id
      ? await api.updateDesign(id, inputs)
      : await api.createDesign(inputs);
    return mapDesign(result.design);
  },
  remove: (id) => api.deleteDesign(id),
};
