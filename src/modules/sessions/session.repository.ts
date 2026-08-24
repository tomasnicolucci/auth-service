import { db } from "../../config/database.js";
import type { PoolClient } from "pg";
import type { Session } from "./session.types.js";

interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipHash: string | null;
  expiresAt: Date;
}

export const createSession = async (
  data: CreateSessionData
): Promise<Session> => {
  const result = await db.query(
    `
      INSERT INTO sessions (
        user_id,
        refresh_token_hash,
        user_agent,
        ip_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        user_id,
        token_family_id,
        refresh_token_hash,
        user_agent,
        ip_hash,
        created_at,
        last_used_at,
        expires_at,
        revoked_at
    `,
    [
      data.userId,
      data.refreshTokenHash,
      data.userAgent,
      data.ipHash,
      data.expiresAt,
    ]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tokenFamilyId: row.token_family_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
};

export interface RefreshSession {
  id: string;
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;

  userEmail: string;
  userRole: string;
  emailVerified: boolean;
}

export const findSessionByCurrentTokenForUpdate = async (
  client: PoolClient,
  refreshTokenHash: string
): Promise<RefreshSession | null> => {
  const result = await client.query(
    `
      SELECT
        s.id,
        s.user_id,
        s.token_family_id,
        s.refresh_token_hash,
        s.expires_at,
        s.revoked_at,
        u.email,
        u.role,
        u.email_verified
      FROM sessions s
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE s.refresh_token_hash = $1
      FOR UPDATE OF s
    `,
    [refreshTokenHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tokenFamilyId: row.token_family_id,
    refreshTokenHash: row.refresh_token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    userEmail: row.email,
    userRole: row.role,
    emailVerified: row.email_verified,
  };
};

export const findSessionByHistoricalTokenForUpdate = async (
  client: PoolClient,
  refreshTokenHash: string
): Promise<RefreshSession | null> => {
  const result = await client.query(
    `
      SELECT
        s.id,
        s.user_id,
        s.token_family_id,
        s.refresh_token_hash,
        s.expires_at,
        s.revoked_at,
        u.email,
        u.role,
        u.email_verified
      FROM refresh_token_history h
      INNER JOIN sessions s
        ON s.id = h.session_id
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE h.refresh_token_hash = $1
      FOR UPDATE OF s
    `,
    [refreshTokenHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tokenFamilyId: row.token_family_id,
    refreshTokenHash: row.refresh_token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    userEmail: row.email,
    userRole: row.role,
    emailVerified: row.email_verified,
  };
};

export const saveRefreshTokenHistory = async (
  client: PoolClient,
  sessionId: string,
  refreshTokenHash: string
): Promise<void> => {
  await client.query(
    `
      INSERT INTO refresh_token_history (
        session_id,
        refresh_token_hash
      )
      VALUES ($1, $2)
    `,
    [sessionId, refreshTokenHash]
  );
};

export const updateSessionRefreshToken = async (
  client: PoolClient,
  sessionId: string,
  refreshTokenHash: string
): Promise<void> => {
  await client.query(
    `
      UPDATE sessions
      SET
        refresh_token_hash = $1,
        last_used_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [refreshTokenHash, sessionId]
  );
};

export const revokeSession = async (
  client: PoolClient,
  sessionId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND revoked_at IS NULL
    `,
    [sessionId]
  );
};

export interface UserSession {
  id: string;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export const revokeSessionByRefreshTokenHash = async (
  refreshTokenHash: string
): Promise<void> => {
  await db.query(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
    `,
    [refreshTokenHash]
  );
};

export const revokeAllUserSessions = async (
  userId: string
): Promise<void> => {
  await db.query(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND revoked_at IS NULL
    `,
    [userId]
  );
};

export const findActiveSessionsByUserId = async (
  userId: string
): Promise<UserSession[]> => {
  const result = await db.query(
    `
      SELECT
        id,
        user_agent,
        created_at,
        last_used_at,
        expires_at
      FROM sessions
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_used_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
  }));
};

export const revokeUserSessionById = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  await db.query(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2
        AND revoked_at IS NULL
    `,
    [sessionId, userId]
  );
};

export const revokeAllUserSessionsWithClient = async (
  client: PoolClient,
  userId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND revoked_at IS NULL
    `,
    [userId]
  );
};