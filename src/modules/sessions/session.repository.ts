import { db } from "../../config/database.js";
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