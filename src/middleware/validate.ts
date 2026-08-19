import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import type { ZodType } from "zod";

export const validate = (
  schema: ZodType
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validation.error.flatten(),
      });
    }

    req.body = validation.data;

    next();
  };
};