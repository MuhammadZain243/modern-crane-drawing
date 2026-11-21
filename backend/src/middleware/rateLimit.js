import rateLimit from "express-rate-limit";
import { limits } from "../config.js";

export const apiLimiter = rateLimit({
  windowMs: limits.rateLimitWindowMs,
  limit: limits.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests, try again later",
      },
    });
  },
});
