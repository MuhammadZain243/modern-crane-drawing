import { Router } from "express";
import { inputRanges, DUTY_GROUPS } from "../config.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Frontend reads ranges from here so they are never hardcoded in two places.
router.get("/config", (req, res) => {
  res.json({ inputRanges, dutyGroups: DUTY_GROUPS });
});

// Next steps: router.use('/designs', designsRouter);

export default router;
