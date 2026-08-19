import type { Request, Response } from "express";
import type { RegisterInput } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    user,
  });
};