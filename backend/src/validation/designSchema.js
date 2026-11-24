import { z } from "zod";
import { DUTY_GROUPS, inputRanges } from "../config.js";
import { AppError } from "../utils/AppError.js";

export const designSchema = z
  .object({
    name: z
      .string({ error: "Must be a string" })
      .trim()
      .min(inputRanges.name.minLength, {
        error: `Must be at least ${inputRanges.name.minLength} character`,
      })
      .max(inputRanges.name.maxLength, {
        error: `Must be at most ${inputRanges.name.maxLength} characters`,
      }),
    capacityT: z
      .number({ error: "Must be a number" })
      .finite({ error: "Must be a finite number" })
      .min(inputRanges.capacityT.min, {
        error: `Must be between ${inputRanges.capacityT.min} and ${inputRanges.capacityT.max}`,
      })
      .max(inputRanges.capacityT.max, {
        error: `Must be between ${inputRanges.capacityT.min} and ${inputRanges.capacityT.max}`,
      }),
    spanM: z
      .number({ error: "Must be a number" })
      .finite({ error: "Must be a finite number" })
      .min(inputRanges.spanM.min, {
        error: `Must be between ${inputRanges.spanM.min} and ${inputRanges.spanM.max}`,
      })
      .max(inputRanges.spanM.max, {
        error: `Must be between ${inputRanges.spanM.min} and ${inputRanges.spanM.max}`,
      }),
    liftHeightM: z
      .number({ error: "Must be a number" })
      .finite({ error: "Must be a finite number" })
      .min(inputRanges.liftHeightM.min, {
        error: `Must be between ${inputRanges.liftHeightM.min} and ${inputRanges.liftHeightM.max}`,
      })
      .max(inputRanges.liftHeightM.max, {
        error: `Must be between ${inputRanges.liftHeightM.min} and ${inputRanges.liftHeightM.max}`,
      }),
    endClearanceLeftMm: z
      .number({ error: "Must be an integer" })
      .int({ error: "Must be an integer" })
      .min(inputRanges.endClearanceLeftMm.min, {
        error: `Must be between ${inputRanges.endClearanceLeftMm.min} and ${inputRanges.endClearanceLeftMm.max}`,
      })
      .max(inputRanges.endClearanceLeftMm.max, {
        error: `Must be between ${inputRanges.endClearanceLeftMm.min} and ${inputRanges.endClearanceLeftMm.max}`,
      }),
    endClearanceRightMm: z
      .number({ error: "Must be an integer" })
      .int({ error: "Must be an integer" })
      .min(inputRanges.endClearanceRightMm.min, {
        error: `Must be between ${inputRanges.endClearanceRightMm.min} and ${inputRanges.endClearanceRightMm.max}`,
      })
      .max(inputRanges.endClearanceRightMm.max, {
        error: `Must be between ${inputRanges.endClearanceRightMm.min} and ${inputRanges.endClearanceRightMm.max}`,
      }),
    dutyGroup: z.enum(DUTY_GROUPS, {
      error: `Must be one of: ${DUTY_GROUPS.join(", ")}`,
    }),
  })
  .strict();

function validationFields(issues) {
  const fields = {};

  for (const issue of issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) fields[key] = "Unknown field";
      continue;
    }

    const key = issue.path.length > 0 ? issue.path.join(".") : "body";
    fields[key] ??= issue.message;
  }

  return fields;
}

export function parseDesignInput(value) {
  const result = designSchema.safeParse(value);
  if (!result.success) {
    throw AppError.validation("Invalid input", validationFields(result.error.issues));
  }
  return result.data;
}

export const designListQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
    offset: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  })
  .strict();

export function parseDesignListQuery(value) {
  const result = designListQuerySchema.safeParse(value);
  if (!result.success) {
    throw AppError.validation("Invalid pagination parameters", validationFields(result.error.issues));
  }
  return result.data;
}

export function parseDesignId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw AppError.validation("Invalid design id", { id: "Must be a positive integer" });
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw AppError.validation("Invalid design id", { id: "Must be a positive integer" });
  }

  return id;
}