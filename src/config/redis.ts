import { createClient } from "redis";
import { env } from "./env.js";

export const redis = createClient({
  url: env.redisUrl,
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export const connectRedis = async (): Promise<void> => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};