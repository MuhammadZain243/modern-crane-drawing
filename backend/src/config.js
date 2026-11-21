import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dbPath: process.env.DB_PATH || "./data/designs.db",
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
