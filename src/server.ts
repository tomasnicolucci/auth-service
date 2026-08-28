import app from "./app.js";
import { db } from "./config/database.js";
import { env } from "./config/env.js";
import { connectRedis, redis } from "./config/redis.js";

const startServer = async () => {
  await connectRedis();

  const server = app.listen(env.port, () => {
    console.log(
      `Server running on port ${env.port}`
    );
  });

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async (error) => {
      if (error) {
        console.error("Error closing HTTP server:", error);
        process.exit(1);
      }

      try {
        await db.end();

        if (redis.isOpen) {
          await redis.quit();
        }

        console.log("Shutdown completed");
        process.exit(0);
      } catch (shutdownError) {
        console.error("Error during shutdown:", shutdownError);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});