import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";
import app from "../../app.js";
import { db } from "../../config/database.js";

const userData = {
  email: "test@example.com",
  password: "Password123",
};

describe("POST /auth/login", () => {
  it("logs in with valid credentials", async () => {
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);

    const response = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(response.status).toBe(200);

    expect(response.body.user).toMatchObject({
      email: userData.email,
      role: "user",
      emailVerified: false,
    });

    expect(response.body.user).toHaveProperty(
      "id"
    );

    expect(response.body.tokens).toHaveProperty(
      "accessToken"
    );

    expect(response.body.tokens).toHaveProperty(
      "refreshToken"
    );

    expect(response.body.tokens.tokenType).toBe(
      "Bearer"
    );

    expect(response.body.session).toHaveProperty(
      "id"
    );

    expect(response.body.session).toHaveProperty(
      "expiresAt"
    );

    const sessionResult = await db.query(
      `
        SELECT
          id,
          user_id,
          refresh_token_hash,
          revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [response.body.session.id]
    );

    expect(sessionResult.rowCount).toBe(1);

    expect(
      sessionResult.rows[0].user_id
    ).toBe(
      response.body.user.id
    );

    expect(
      sessionResult.rows[0].revoked_at
    ).toBeNull();

    expect(
      sessionResult.rows[0].refresh_token_hash
    ).not.toBe(
      response.body.tokens.refreshToken
    );
  });

  it("rejects an incorrect password", async () => {
    await request(app)
      .post("/auth/register")
      .send(userData);

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: userData.email,
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      error: "Invalid email or password",
    });
  });

  it("rejects a non-existing user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "unknown@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      error: "Invalid email or password",
    });
  });

  it("returns the same error for an invalid email and an invalid password", async () => {
    await request(app)
      .post("/auth/register")
      .send(userData);

    const wrongPasswordResponse =
      await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: "WrongPassword123",
        });

    const unknownUserResponse =
      await request(app)
        .post("/auth/login")
        .send({
          email: "unknown@example.com",
          password: "Password123",
        });

    expect(wrongPasswordResponse.status).toBe(
      401
    );

    expect(unknownUserResponse.status).toBe(
      401
    );

    expect(
      wrongPasswordResponse.body.error
    ).toBe(
      unknownUserResponse.body.error
    );
  });

  it("creates multiple sessions when the user logs in multiple times", async () => {
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    const userId =
      registerResponse.body.user.id;

    const firstLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(firstLogin.status).toBe(200);

    const secondLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(secondLogin.status).toBe(200);

    expect(
      firstLogin.body.session.id
    ).not.toBe(
      secondLogin.body.session.id
    );

    expect(
      firstLogin.body.tokens.refreshToken
    ).not.toBe(
      secondLogin.body.tokens.refreshToken
    );

    const sessionsResult = await db.query(
      `
        SELECT id
        FROM sessions
        WHERE user_id = $1
          AND revoked_at IS NULL
      `,
      [userId]
    );

    expect(sessionsResult.rowCount).toBe(2);
  });
});