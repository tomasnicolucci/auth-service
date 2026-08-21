import { db } from "../../config/database.js";
import type { EmailVerificationToken } from "./email-verification.types.js";

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