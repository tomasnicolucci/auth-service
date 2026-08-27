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

const registerAndLogin = async () => {
  const registerResponse = await request(app)
    .post("/auth/register")
    .send(userData);

  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app)
    .post("/auth/login")
    .send(userData);

  expect(loginResponse.status).toBe(200);

  return loginResponse;
};

describe("POST /auth/refresh", () => {
  it("rotates a valid refresh token", async () => {
    const loginResponse =
      await registerAndLogin();

    const oldRefreshToken =
      loginResponse.body.tokens.refreshToken;

    const sessionId =
      loginResponse.body.session.id;

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: oldRefreshToken,
      });

    expect(response.status).toBe(200);

    expect(response.body.tokens).toHaveProperty(
      "accessToken"
    );

    expect(response.body.tokens).toHaveProperty(
      "refreshToken"
    );

    expect(
      response.body.tokens.refreshToken
    ).not.toBe(oldRefreshToken);

    const sessionResult = await db.query(
      `
        SELECT
          refresh_token_hash,
          revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionId]
    );

    expect(sessionResult.rowCount).toBe(1);

    expect(
      sessionResult.rows[0].revoked_at
    ).toBeNull();

    const historyResult = await db.query(
      `
        SELECT *
        FROM refresh_token_history
        WHERE session_id = $1
      `,
      [sessionId]
    );

    expect(historyResult.rowCount).toBe(1);
  });

  it("rejects an invalid refresh token", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken:
          "this-is-not-a-valid-refresh-token",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      error: "Invalid refresh token",
    });
  });

  it("detects refresh token reuse and revokes the session", async () => {
    const loginResponse =
      await registerAndLogin();

    const firstRefreshToken =
      loginResponse.body.tokens.refreshToken;

    const sessionId =
      loginResponse.body.session.id;

    const firstRefreshResponse =
      await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: firstRefreshToken,
        });

    expect(
      firstRefreshResponse.status
    ).toBe(200);

    const secondRefreshToken =
      firstRefreshResponse.body.tokens
        .refreshToken;

    expect(secondRefreshToken).not.toBe(
      firstRefreshToken
    );

    // Intentamos reutilizar el token anterior.
    const reuseResponse = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: firstRefreshToken,
      });

    expect(reuseResponse.status).toBe(401);

    expect(reuseResponse.body).toMatchObject({
      error: "Refresh token reuse detected",
    });

    const sessionResult = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionId]
    );

    expect(
      sessionResult.rows[0].revoked_at
    ).not.toBeNull();

    // Como hubo reuse detection, incluso el token
    // nuevo debe dejar de funcionar.
    const currentTokenResponse =
      await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: secondRefreshToken,
        });

    expect(
      currentTokenResponse.status
    ).toBe(401);
  });

  it("rejects a refresh token from an expired session", async () => {
    const loginResponse =
      await registerAndLogin();

    const refreshToken =
      loginResponse.body.tokens.refreshToken;

    const sessionId =
      loginResponse.body.session.id;

    // Simulamos que la sesión expiró.
    await db.query(
      `
        UPDATE sessions
        SET expires_at =
          CURRENT_TIMESTAMP - INTERVAL '1 minute'
        WHERE id = $1
      `,
      [sessionId]
    );

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken,
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      error: "Refresh token expired",
    });

    const sessionResult = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionId]
    );

    expect(
      sessionResult.rows[0].revoked_at
    ).not.toBeNull();
  });
});