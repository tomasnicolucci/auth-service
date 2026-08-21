import type { Request, Response } from "express";
import type { LoginInput, LogoutInput, RefreshInput, RegisterInput, } from "./auth.schemas.js";
import { getUserSessions, loginUser, logoutAllUserSessions, logoutUser, refreshAccessToken, registerUser, revokeUserSession, } from "./auth.service.js";

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

export const logout = async (
  req: Request<{}, {}, LogoutInput>,
  res: Response
) => {
  await logoutUser(req.body);

  return res.status(204).send();
};

export const logoutAll = async (
  req: Request,
  res: Response
) => {
  await logoutAllUserSessions(
    req.auth!.userId
  );

  return res.status(204).send();
};

export const getSessions = async (
  req: Request,
  res: Response
) => {
  const sessions = await getUserSessions(
    req.auth!.userId
  );

  return res.status(200).json({
    sessions,
  });
};

export const deleteSession = async (
  req: Request<{ sessionId: string }>,
  res: Response
) => {
  await revokeUserSession(
    req.auth!.userId,
    req.params.sessionId
  );

  return res.status(204).send();
};