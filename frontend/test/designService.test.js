import assert from "node:assert/strict";
import test from "node:test";
import {
  mapConfig,
  mapDesign,
  mapDesignToForm,
  mapFormToPayload,
} from "../src/services/designService.js";

const config = mapConfig({
  inputRanges: {
    name: { minLength: 1, maxLength: 100 },
    capacityT: { min: 1, max: 20 },
    spanM: { min: 5, max: 30 },
    liftHeightM: { min: 3, max: 15 },
    endClearanceLeftMm: { min: 100, max: 1500 },
    endClearanceRightMm: { min: 100, max: 1500 },
  },
  dutyGroups: ["A3", "A4", "A5", "A6"],
});

const validForm = {
  name: "  sample crane  ",
  capacityT: "10",
  spanM: "25",
  liftHeightM: "7.9",
  endClearanceLeftMm: "235",
  endClearanceRightMm: "300",
  dutyGroup: "A5",
};

test("form service trims and converts the backend payload", () => {
  const result = mapFormToPayload(validForm, config);
  assert.deepEqual(result.fields, {});
  assert.deepEqual(result.payload, {
    name: "sample crane",
    capacityT: 10,
    spanM: 25,
    liftHeightM: 7.9,
    endClearanceLeftMm: 235,
    endClearanceRightMm: 300,
    dutyGroup: "A5",
  });
});

test("form service returns field errors for invalid values without coercion surprises", () => {
  const result = mapFormToPayload(
    { ...validForm, name: "  ", spanM: "", endClearanceLeftMm: "100.5" },
    config,
  );
  assert.equal(result.fields.name, "Enter a design name.");
  assert.ok(result.fields.spanM);
  assert.equal(result.fields.endClearanceLeftMm, "Enter a whole number in millimetres.");
});

test("design service maps backend models to editable form values", () => {
  const backendDesign = {
    id: 8,
    name: "Quote design",
    inputs: {
      capacityT: 10,
      spanM: 25,
      liftHeightM: 7.9,
      endClearanceLeftMm: 235,
      endClearanceRightMm: 300,
      dutyGroup: "A5",
    },
    dimensions: [{ key: "spanMm", valueMm: 25000, source: "input" }],
    schemaVersion: 1,
    createdAt: "2026-11-24 10:00:00",
    updatedAt: "2026-11-24 12:00:00",
  };
  const mapped = mapDesign(backendDesign);
  assert.equal(mapped.id, 8);
  assert.equal(mapped.dimensions[0].valueMm, 25000);
  assert.equal(mapDesignToForm(mapped).spanM, "25");
  assert.equal(mapDesignToForm(mapped).name, "Quote design");
});
