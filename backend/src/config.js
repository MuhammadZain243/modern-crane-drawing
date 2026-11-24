import "dotenv/config";

const portValue = process.env.PORT ?? "4000";
const port = Number(portValue);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const corsOrigin = process.env.CORS_ORIGIN?.trim() || "http://localhost:5173";
let parsedCorsOrigin;
try {
  parsedCorsOrigin = new URL(corsOrigin);
} catch {
  throw new Error("CORS_ORIGIN must be a valid HTTP or HTTPS origin");
}
if (
  !["http:", "https:"].includes(parsedCorsOrigin.protocol) ||
  parsedCorsOrigin.origin !== corsOrigin
) {
  throw new Error("CORS_ORIGIN must be a valid HTTP or HTTPS origin without a path");
}

const dbPath =
  process.env.DB_PATH === undefined ? "./data/designs.db" : process.env.DB_PATH.trim();
if (!dbPath) throw new Error("DB_PATH must not be empty");

export const env = {
  port,
  corsOrigin,
  dbPath,
};

export const limits = {
  bodyLimit: "10kb",
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 300, // requests per window per IP
};

// Single source of truth for input ranges.
// ALL RANGES ARE ASSUMPTIONS until confirmed by a crane engineer.
// Sample drawing: 10 t, 25 m span, 7.9 m lift, FEM A5, Min.235 end clearance.
export const inputRanges = {
  capacityT: { min: 1, max: 20, unit: "t" },
  spanM: { min: 5, max: 30, unit: "m" },
  liftHeightM: { min: 3, max: 15, unit: "m" },
  endClearanceLeftMm: { min: 100, max: 1500, unit: "mm" },
  endClearanceRightMm: { min: 100, max: 1500, unit: "mm" },
  name: { minLength: 1, maxLength: 100 },
};

export const DUTY_GROUPS = ["A3", "A4", "A5", "A6"];
