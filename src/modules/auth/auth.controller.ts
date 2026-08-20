import type { Request, Response } from "express";
import type { LoginInput, RegisterInput, } from "./auth.schemas.js";
import { loginUser, registerUser, } from "./auth.service.js";

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    user,
  });
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
) => {
  const result = await loginUser(req.body, {
    userAgent: req.get("user-agent") ?? null,
    ip: req.ip ?? null,
  });

  return res.status(200).json(result);
};