import argon2 from "argon2";
import {
  createUser,
  findUserByEmail,
  markUserEmailAsVerified,
} from "../users/user.repository.js";
import { AppError } from "../../errors/AppError.js";
import { createHash } from "node:crypto";
import { createSession, findActiveSessionsByUserId, findSessionByCurrentTokenForUpdate, findSessionByHistoricalTokenForUpdate, revokeAllUserSessions, revokeSession, revokeSessionByRefreshTokenHash, revokeUserSessionById, saveRefreshTokenHistory, updateSessionRefreshToken } from "../sessions/session.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
} from "../../security/tokens.js";
import { env } from "../../config/env.js";
import type {
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  VerifyEmailInput,
} from "./auth.schemas.js";
import { db } from "../../config/database.js";
import { createEmailVerificationToken, findVerificationTokenForUpdate, markVerificationTokenAsUsed, } from "../email-verification/email-verification.repository.js";
import { sendVerificationEmail } from "../../services/mail.service.js";

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

  const verificationToken = generateSecureToken();

  const verificationTokenHash = hashToken(
    verificationToken
  );

  const verificationExpiresAt = new Date(
    Date.now() +
      env.emailVerificationTtlMinutes * 60 * 1000
  );

  await createEmailVerificationToken({
    userId: user.id,
    tokenHash: verificationTokenHash,
    expiresAt: verificationExpiresAt,
  });

  await sendVerificationEmail({
    email: user.email,
    token: verificationToken,
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

export const refreshAccessToken = async (
  input: RefreshInput
) => {
  const presentedTokenHash = hashToken(
    input.refreshToken
  );

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const session =
      await findSessionByCurrentTokenForUpdate(
        client,
        presentedTokenHash
      );

    if (!session) {
      const reusedSession =
        await findSessionByHistoricalTokenForUpdate(
          client,
          presentedTokenHash
        );

      if (reusedSession) {
        await revokeSession(
          client,
          reusedSession.id
        );

        await client.query("COMMIT");

        throw new AppError(
          "Refresh token reuse detected",
          401
        );
      }

      await client.query("ROLLBACK");

      throw new AppError(
        "Invalid refresh token",
        401
      );
    }

    if (session.revokedAt) {
      await client.query("ROLLBACK");

      throw new AppError(
        "Invalid refresh token",
        401
      );
    }

    if (session.expiresAt <= new Date()) {
      await revokeSession(
        client,
        session.id
      );

      await client.query("COMMIT");

      throw new AppError(
        "Refresh token expired",
        401
      );
    }

    const newRefreshToken =
      generateRefreshToken();

    const newRefreshTokenHash =
      hashToken(newRefreshToken);

    await saveRefreshTokenHistory(
      client,
      session.id,
      presentedTokenHash
    );

    await updateSessionRefreshToken(
      client,
      session.id,
      newRefreshTokenHash
    );

    const newAccessToken =
      await generateAccessToken({
        userId: session.userId,
        email: session.userEmail,
        role: session.userRole,
      });

    await client.query("COMMIT");

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      expiresIn: env.accessTokenTtl,
    };
  } catch (error) {
    if (
      error instanceof AppError
    ) {
      throw error;
    }

    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error.
    }

    throw error;
  } finally {
    client.release();
  }
};

export const logoutUser = async (
  input: LogoutInput
): Promise<void> => {
  const refreshTokenHash = hashToken(
    input.refreshToken
  );

  await revokeSessionByRefreshTokenHash(
    refreshTokenHash
  );
};

export const logoutAllUserSessions = async (
  userId: string
): Promise<void> => {
  await revokeAllUserSessions(userId);
};

export const getUserSessions = async (
  userId: string
) => {
  return findActiveSessionsByUserId(userId);
};

export const revokeUserSession = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  await revokeUserSessionById(
    userId,
    sessionId
  );
};

export const verifyUserEmail = async (
  input: VerifyEmailInput
): Promise<void> => {
  const tokenHash = hashToken(input.token);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const verificationToken =
      await findVerificationTokenForUpdate(
        client,
        tokenHash
      );

    if (!verificationToken) {
      await client.query("ROLLBACK");

      throw new AppError(
        "Invalid verification token",
        400
      );
    }

    if (verificationToken.usedAt) {
      await client.query("ROLLBACK");

      throw new AppError(
        "Verification token already used",
        400
      );
    }

    if (
      verificationToken.expiresAt <= new Date()
    ) {
      await client.query("ROLLBACK");

      throw new AppError(
        "Verification token expired",
        400
      );
    }

    await markUserEmailAsVerified(
      client,
      verificationToken.userId
    );

    await markVerificationTokenAsUsed(
      client,
      verificationToken.id
    );

    await client.query("COMMIT");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve original error.
    }

    throw error;
  } finally {
    client.release();
  }
};