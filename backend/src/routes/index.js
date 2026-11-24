import { Router } from "express";
import { inputRanges, DUTY_GROUPS } from "../config.js";
import { addRoute } from "../utils/routeTable.js";
import designsRouter from "./designs.js";

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

router.use("/designs", designsRouter);

export default router;
