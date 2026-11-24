import db from "../db.js";
import { SCHEMA_VERSION, calculateDimensions } from "./dimensions.js";

const selectById = db.prepare("SELECT * FROM designs WHERE id = ?");
const countDesigns = db.prepare("SELECT COUNT(*) AS total FROM designs");
const listDesigns = db.prepare(`
  SELECT * FROM designs
  ORDER BY created_at DESC, id DESC
  LIMIT ? OFFSET ?
`);
const insertDesign = db.prepare(`
  INSERT INTO designs (
    name, capacity_t, span_m, lift_height_m,
    end_clearance_left_mm, end_clearance_right_mm, duty_group, schema_version
  ) VALUES (
    @name, @capacityT, @spanM, @liftHeightM,
    @endClearanceLeftMm, @endClearanceRightMm, @dutyGroup, @schemaVersion
  )
`);
const updateDesign = db.prepare(`
  UPDATE designs SET
    name = @name,
    capacity_t = @capacityT,
    span_m = @spanM,
    lift_height_m = @liftHeightM,
    end_clearance_left_mm = @endClearanceLeftMm,
    end_clearance_right_mm = @endClearanceRightMm,
    duty_group = @dutyGroup,
    schema_version = @schemaVersion,
    updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
  WHERE id = @id
`);
const deleteDesign = db.prepare("DELETE FROM designs WHERE id = ?");

function toInputs(row) {
  return {
    name: row.name,
    capacityT: row.capacity_t,
    spanM: row.span_m,
    liftHeightM: row.lift_height_m,
    endClearanceLeftMm: row.end_clearance_left_mm,
    endClearanceRightMm: row.end_clearance_right_mm,
    dutyGroup: row.duty_group,
  };
}

function toDesign(row) {
  const inputs = toInputs(row);
  return {
    id: row.id,
    name: row.name,
    inputs: {
      capacityT: inputs.capacityT,
      spanM: inputs.spanM,
      liftHeightM: inputs.liftHeightM,
      endClearanceLeftMm: inputs.endClearanceLeftMm,
      endClearanceRightMm: inputs.endClearanceRightMm,
      dutyGroup: inputs.dutyGroup,
    },
    dimensions: calculateDimensions(inputs),
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function statementValues(inputs) {
  return {
    ...inputs,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function previewDesign(inputs) {
  return calculateDimensions(inputs);
}

export function createDesign(inputs) {
  const result = insertDesign.run(statementValues(inputs));
  return getDesign(result.lastInsertRowid);
}

export function listDesignsPage({ limit, offset }) {
  const rows = listDesigns.all(limit, offset);
  return {
    designs: rows.map(toDesign),
    pagination: {
      limit,
      offset,
      total: countDesigns.get().total,
    },
  };
}

export function getDesign(id) {
  const row = selectById.get(id);
  return row ? toDesign(row) : null;
}

export function updateDesignById(id, inputs) {
  const result = updateDesign.run({ ...statementValues(inputs), id });
  return result.changes === 0 ? null : getDesign(id);
}

export function deleteDesignById(id) {
  return deleteDesign.run(id).changes > 0;
}
