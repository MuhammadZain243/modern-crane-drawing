import { Router } from "express";
import { inputRanges, DUTY_GROUPS } from "../config.js";
import { addRoute } from "../utils/routeTable.js";

export const API_PREFIX = "/api";

const router = Router();

addRoute(router, API_PREFIX, "get", "/health", "Health check", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Frontend reads ranges from here so they are never hardcoded in two places.
addRoute(
  router,
  API_PREFIX,
  "get",
  "/config",
  "Input ranges and duty groups",
  (req, res) => {
    res.json({ inputRanges, dutyGroups: DUTY_GROUPS });
  },
);

// Next steps: designs routes will also use addRoute(), so they show up
// in the startup list automatically.

export default router;
