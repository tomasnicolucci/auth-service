import express from "express";
import { db } from "./config/database.js";
import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import jwksRouter from "./modules/jwks/jwks.routes.js";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";

const app = express();

app.disable("x-powered-by");

app.set(
  "trust proxy",
  env.trustProxy
);

app.use(helmet());

app.use(
  cors({
    origin: env.corsOrigin,
    methods: [
      "GET",
      "POST",
      "DELETE",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json({
    limit: "10kb",
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.status(200).json({
      status: "ready",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "not_ready",
      database: "disconnected",
    });
  }
});

app.use("/auth", authRouter);
app.use("/.well-known", jwksRouter);

app.use(errorHandler);

export default app;