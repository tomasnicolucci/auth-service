import type { Request, Response } from "express";
import type { LoginInput, RefreshInput, RegisterInput, } from "./auth.schemas.js";
import { loginUser, refreshAccessToken, registerUser, } from "./auth.service.js";

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

export const refresh = async (
  req: Request<{}, {}, RefreshInput>,
  res: Response
) => {
  const tokens = await refreshAccessToken(
    req.body
  );

  return res.status(200).json({
    tokens,
  });
};

export const me = async (
  req: Request,
  res: Response
) => {
  return res.status(200).json({
    user: req.auth,
  });
};