import argon2 from "argon2";
import {
  createUser,
  findUserByEmail,
} from "../users/user.repository.js";
import { AppError } from "../../errors/AppError.js";
import { createHash } from "node:crypto";
import { createSession } from "../sessions/session.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../security/tokens.js";
import { env } from "../../config/env.js";
import type {
  LoginInput,
  RegisterInput,
} from "./auth.schemas.js";

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const user = await createUser({
    email: input.email,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
};

interface LoginMetadata {
  userAgent: string | null;
  ip: string | null;
}

export const loginUser = async (
  input: LoginInput,
  metadata: LoginMetadata
) => {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await argon2.verify(
    user.passwordHash,
    input.password
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  const refreshTokenHash = hashToken(refreshToken);

  const ipHash = metadata.ip
    ? createHash("sha256")
        .update(metadata.ip)
        .digest("hex")
    : null;

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + env.refreshTokenTtlDays
  );

  const session = await createSession({
    userId: user.id,
    refreshTokenHash,
    userAgent: metadata.userAgent,
    ipHash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },

    tokens: {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: env.accessTokenTtl,
    },

    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  };
};