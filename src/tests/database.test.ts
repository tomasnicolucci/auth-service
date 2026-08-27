import {
  describe,
  expect,
  it,
} from "vitest";

const { db } = await import(
  "../config/database.js"
);

describe("Database test isolation", () => {
  it("can insert a user", async () => {
    await db.query(
      `
        INSERT INTO users (
          email,
          password_hash
        )
        VALUES ($1, $2)
      `,
      [
        "test@example.com",
        "fake-hash",
      ]
    );

    const result = await db.query(
      "SELECT * FROM users"
    );

    expect(result.rowCount).toBe(1);
  });

  it("starts the next test with an empty database", async () => {
    const result = await db.query(
      "SELECT * FROM users"
    );

    expect(result.rowCount).toBe(0);
  });
});