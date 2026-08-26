import { createHash } from "node:crypto";
import { redis } from "../config/redis.js";
import { AppError } from "../errors/AppError.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 15 * 60;

const hashIdentifier = (
  value: string
): string => {
  return createHash("sha256")
    .update(value)
    .digest("hex");
};

const getKey = (
  email: string,
  ip: string
): string => {
  const emailHash = hashIdentifier(
    email.toLowerCase()
  );

  const ipHash = hashIdentifier(ip);

  return `auth:login-failures:${emailHash}:${ipHash}`;
};

export const checkLoginAttempts = async (
  email: string,
  ip: string
): Promise<void> => {
  const key = getKey(email, ip);

  const attempts = Number(
    (await redis.get(key)) ?? 0
  );

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    throw new AppError(
      "Too many failed login attempts. Please try again later.",
      429
    );
  }
};

export const recordFailedLogin = async (
  email: string,
  ip: string
): Promise<void> => {
  const key = getKey(email, ip);

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(
      key,
      LOCK_SECONDS
    );
  }
};

export const clearFailedLogins = async (
  email: string,
  ip: string
): Promise<void> => {
  const key = getKey(email, ip);

  await redis.del(key);
};