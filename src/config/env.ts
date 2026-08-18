import "dotenv/config";

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;

if (!port) {
  throw new Error("PORT environment variable is required");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

export const env = {
  port,
  databaseUrl,
  redisUrl,
};