import assert from "node:assert/strict";
import test from "node:test";
import { calculateDimensions } from "../src/services/dimensions.js";
import { designSchema, parseDesignId, parseDesignListQuery } from "../src/validation/designSchema.js";

const inputs = {
  name: "10t sample",
  capacityT: 10,
  spanM: 25,
  liftHeightM: 7.9,
  endClearanceLeftMm: 235,
  endClearanceRightMm: 300,
  dutyGroup: "A5",
};

test("calculateDimensions is deterministic and labels estimated values", () => {
  const first = calculateDimensions(inputs);
  const second = calculateDimensions(inputs);

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map(({ key, valueMm, source }) => ({ key, valueMm, source })),
    [
      { key: "spanMm", valueMm: 25000, source: "input" },
      { key: "liftHeightMm", valueMm: 7900, source: "input" },
      { key: "endClearanceLeftMm", valueMm: 235, source: "input" },
      { key: "endClearanceRightMm", valueMm: 300, source: "input" },
      { key: "girderDepthMm", valueMm: 1250, source: "estimate" },
    ],
  );
  assert.ok(first.every(({ source, note }) => source && note.length > 0));
});

test("design validation rejects invalid numbers and unknown fields", () => {
  assert.equal(designSchema.safeParse({ ...inputs, spanM: Number.NaN }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, capacityT: Infinity }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, spanM: "25" }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, capacityT: -1 }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, endClearanceLeftMm: 99 }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, extra: true }).success, false);
  assert.equal(designSchema.safeParse({ ...inputs, name: "   " }).success, false);
});

test("design validation accepts the configured range boundaries", () => {
  const minimum = {
    name: "minimum",
    capacityT: 1,
    spanM: 5,
    liftHeightM: 3,
    endClearanceLeftMm: 100,
    endClearanceRightMm: 100,
    dutyGroup: "A3",
  };
  const maximum = {
    name: "maximum",
    capacityT: 20,
    spanM: 30,
    liftHeightM: 15,
    endClearanceLeftMm: 1500,
    endClearanceRightMm: 1500,
    dutyGroup: "A6",
  };

  assert.equal(designSchema.safeParse(minimum).success, true);
  assert.equal(designSchema.safeParse(maximum).success, true);
  assert.equal(calculateDimensions(minimum).at(-1).valueMm, 250);
  assert.equal(calculateDimensions(maximum).at(-1).valueMm, 1500);
});

test("pagination and ids accept only bounded positive integer inputs", () => {
  assert.deepEqual(parseDesignListQuery({ limit: "10", offset: "2" }), {
    limit: 10,
    offset: 2,
  });
  assert.deepEqual(parseDesignListQuery({}), { limit: 20, offset: 0 });
  assert.throws(() => parseDesignListQuery({ limit: "101" }));
  assert.throws(() => parseDesignListQuery({ unexpected: "1" }));
  assert.equal(parseDesignId("42"), 42);
  for (const id of ["0", "-1", "1.5", "9007199254740992", "abc"]) {
    assert.throws(() => parseDesignId(id));
  }
});
