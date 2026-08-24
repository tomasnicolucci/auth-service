import { db } from "../../config/database.js";
import type { PoolClient } from "pg";

interface CreatePasswordResetTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const createPasswordResetToken = async (
  data: CreatePasswordResetTokenData
): Promise<void> => {
  await db.query(
    `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [
      data.userId,
      data.tokenHash,
      data.expiresAt,
    ]
  );
};

export const invalidateActivePasswordResetTokens = async (
  userId: string
): Promise<void> => {
  await db.query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [userId]
  );
};

export const findPasswordResetTokenForUpdate = async (
  client: PoolClient,
  tokenHash: string
) => {
  const result = await client.query(
    `
      SELECT
        id,
        user_id,
        expires_at,
        used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
      FOR UPDATE
    `,
    [tokenHash]
  );

  return result.rows[0] ?? null;
};

export const markPasswordResetTokenAsUsed = async (
  client: PoolClient,
  tokenId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [tokenId]
  );
};

export const invalidateOtherPasswordResetTokens = async (
  client: PoolClient,
  userId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [userId]
  );
};