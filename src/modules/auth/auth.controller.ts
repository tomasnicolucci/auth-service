import type { Request, Response } from "express";
import { registerSchema } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";

export const register = async (
  req: Request,
  res: Response
) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: validation.error.flatten(),
    });
  }

  try {
    const user = await registerUser(validation.data);

    return res.status(201).json({
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    throw error;
  }
};