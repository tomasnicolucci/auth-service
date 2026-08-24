import type { PoolClient } from "pg";

export const findPasswordHistory = async (
  client: PoolClient,
  userId: string
): Promise<string[]> => {
  const result = await client.query(
    `
      SELECT password_hash
      FROM password_history
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map(
    (row) => row.password_hash
  );
};

export const addPasswordToHistory = async (
  client: PoolClient,
  userId: string,
  passwordHash: string
): Promise<void> => {
  await client.query(
    `
      INSERT INTO password_history (
        user_id,
        password_hash
      )
      VALUES ($1, $2)
    `,
    [userId, passwordHash]
  );
};