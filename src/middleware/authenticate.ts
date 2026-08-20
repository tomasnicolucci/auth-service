import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../security/tokens.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.get("authorization");

  if (!authorization) {
    throw new AppError(
      "Authentication required",
      401
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    throw new AppError(
      "Invalid authorization header",
      401
    );
  }

  try {
    const payload = await verifyAccessToken(token);

    req.auth = payload;

    next();
  } catch {
    throw new AppError(
      "Invalid or expired access token",
      401
    );
  }
};