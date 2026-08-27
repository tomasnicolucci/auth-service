import dotenv from "dotenv";
import {
  beforeEach,
  afterAll,
} from "vitest";

dotenv.config({
  path: ".env.test",
  override: true,
});

const { db } = await import(
  "../config/database.js"
);

const { redis } = await import(
  "../config/redis.js"
);

const { connectRedis } = await import(
  "../config/redis.js"
);

beforeEach(async () => {
  /*
   * Safety check:
   * jamás permitimos limpiar la DB si no estamos
   * usando explícitamente auth_test_db.
   */
  if (
    !process.env.DATABASE_URL?.includes(
      "auth_test_db"
    )
  ) {
    throw new Error(
      "Tests are not using auth_test_db"
    );
  }

  if (
    !process.env.REDIS_URL?.endsWith("/1")
  ) {
    throw new Error(
      "Tests are not using Redis DB 1"
    );
  }

  await db.query(`
    TRUNCATE TABLE
      refresh_token_history,
      sessions,
      email_verification_tokens,
      password_reset_tokens,
      password_history,
      users
    RESTART IDENTITY
    CASCADE
  `);

  if (!redis.isOpen) {
    await connectRedis();
  }

  await redis.flushDb();
});

afterAll(async () => {
  await db.end();

  if (redis.isOpen) {
    await redis.quit();
  }
});