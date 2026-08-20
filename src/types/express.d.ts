import type { VerifiedAccessToken } from "../security/tokens.js";

declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedAccessToken;
    }
  }
}

export {};