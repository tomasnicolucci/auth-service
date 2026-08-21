import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  exportJWK,
  importPKCS8,
  importSPKI,
  jwtVerify,
  SignJWT,
} from "jose";
import { env } from "../config/env.js";

const algorithm = "RS256";
const keyId = "auth-service-key-1";

const privateKeyPem = await readFile(
  resolve(env.jwtPrivateKeyPath),
  "utf8"
);

const publicKeyPem = await readFile(
  resolve(env.jwtPublicKeyPath),
  "utf8"
);

const privateKey = await importPKCS8(
  privateKeyPem,
  algorithm
);

const publicKey = await importSPKI(
  publicKeyPem,
  algorithm
);

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface VerifiedAccessToken {
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
      kid: keyId,
    })
    .setSubject(payload.userId)
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtAudience)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.accessTokenTtl)
    .sign(privateKey);
};

export const verifyAccessToken = async (
  token: string
): Promise<VerifiedAccessToken> => {
  const { payload } = await jwtVerify(
    token,
    publicKey,
    {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      algorithms: [algorithm],
    }
  );

  if (
    !payload.sub ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
};

export const getPublicJwk = async () => {
  const jwk = await exportJWK(publicKey);

  return {
    ...jwk,
    kid: keyId,
    use: "sig",
    alg: algorithm,
  };
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString("base64url");
};

export const hashToken = (token: string): string => {
  return createHash("sha256")
    .update(token)
    .digest("hex");
};

export const generateSecureToken = (): string => {
  return randomBytes(32).toString("base64url");
};