import { db } from "../../config/database.js";
import type { EmailVerificationToken } from "./email-verification.types.js";
import type { PoolClient } from "pg";

interface CreateEmailVerificationTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const createEmailVerificationToken = async (
  data: CreateEmailVerificationTokenData
): Promise<EmailVerificationToken> => {
  const result = await db.query(
    `
      INSERT INTO email_verification_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        used_at,
        created_at
    `,
    [
      data.userId,
      data.tokenHash,
      data.expiresAt,
    ]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
};

export const findVerificationTokenForUpdate = async (
  client: PoolClient,
  tokenHash: string
): Promise<EmailVerificationToken | null> => {
  const result = await client.query(
    `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        used_at,
        created_at
      FROM email_verification_tokens
      WHERE token_hash = $1
      FOR UPDATE
    `,
    [tokenHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
};

export const markVerificationTokenAsUsed = async (
  client: PoolClient,
  tokenId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE email_verification_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [tokenId]
  );
};