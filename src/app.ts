import express from "express";
import { db } from "./config/database.js";
import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

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

app.use(errorHandler);

export default app;