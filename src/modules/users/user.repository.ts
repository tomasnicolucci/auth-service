import { db } from "../../config/database.js";
import type { User } from "./user.types.js";
import type { PoolClient } from "pg";

interface CreateUserData {
  email: string;
  passwordHash: string;
}

export const findUserByEmail = async (
  email: string
): Promise<User | null> => {
  const result = await db.query(
    `
      SELECT
        id,
        email,
        password_hash,
        role,
        email_verified,
        password_changed_at,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    emailVerified: row.email_verified,
    passwordChangedAt: row.password_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const createUser = async (
  data: CreateUserData
): Promise<User> => {
  const result = await db.query(
    `
      INSERT INTO users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING
        id,
        email,
        password_hash,
        role,
        email_verified,
        password_changed_at,
        created_at,
        updated_at
    `,
    [data.email, data.passwordHash]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    emailVerified: row.email_verified,
    passwordChangedAt: row.password_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const markUserEmailAsVerified = async (
  client: PoolClient,
  userId: string
): Promise<void> => {
  await client.query(
    `
      UPDATE users
      SET
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [userId]
  );
};