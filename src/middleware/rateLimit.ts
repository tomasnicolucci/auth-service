import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import { redis } from "../config/redis.js";
import { AppError } from "../errors/AppError.js";

interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
}

export const rateLimit = (
  options: RateLimitOptions
): RequestHandler => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const identifier = req.ip;

      const key =
        `auth:rate-limit:${options.keyPrefix}:${identifier}`;

      const requests = await redis.incr(key);

      if (requests === 1) {
        await redis.expire(
          key,
          options.windowSeconds
        );
      }

      if (requests > options.maxRequests) {
        throw new AppError(
          "Too many requests. Please try again later.",
          429
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};