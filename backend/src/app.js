import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env, limits } from "./config.js";
import apiRouter from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: limits.bodyLimit }));

app.use("/api", apiLimiter, apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
