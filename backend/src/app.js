import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env, limits } from "./config.js";
import apiRouter, { API_PREFIX } from "./routes/index.js";
import requestLogger from "./middleware/requestLogger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// First, so every request is logged, including blocked and failed ones.
app.use(requestLogger);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: limits.bodyLimit }));

app.use(API_PREFIX, apiLimiter, apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
