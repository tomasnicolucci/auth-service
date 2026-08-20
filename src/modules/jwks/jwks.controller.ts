import type {
  Request,
  Response,
} from "express";
import { getPublicJwk } from "../../security/tokens.js";

export const getJwks = async (
  _req: Request,
  res: Response
) => {
  const publicJwk = await getPublicJwk();

  return res.status(200).json({
    keys: [publicJwk],
  });
};