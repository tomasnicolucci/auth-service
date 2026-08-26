import app from "./app.js";
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";

const startServer = async () => {
  await connectRedis();

  app.listen(env.port, () => {
    console.log(
      `Server running on port ${env.port}`
    );
  });
};

startServer();