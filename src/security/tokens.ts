import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  importPKCS8,
  SignJWT,
} from "jose";
import { env } from "../config/env.js";

const algorithm = "RS256";

const privateKeyPem = await readFile(
  resolve(env.jwtPrivateKeyPath),
  "utf8"
);

const privateKey = await importPKCS8(
  privateKeyPem,
  algorithm
);

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = async (
  payload: AccessTokenPayload
): Promise<string> => {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: algorithm,
      typ: "JWT",
    })
    .setSubject(payload.userId)
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtAudience)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.accessTokenTtl)
    .sign(privateKey);
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString("base64url");
};

export const hashToken = (token: string): string => {
  return createHash("sha256")
    .update(token)
    .digest("hex");
};