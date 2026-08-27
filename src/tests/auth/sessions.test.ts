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

describe("Auth sessions", () => {
  it("lists the authenticated user's active sessions", async () => {
    const firstLogin =
      await registerAndLogin();

    const secondLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(secondLogin.status).toBe(200);

    const accessToken =
      secondLogin.body.tokens.accessToken;

    const response = await request(app)
      .get("/auth/sessions")
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      );

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body.sessions))
      .toBe(true);

    expect(response.body.sessions).toHaveLength(2);

    const sessionIds =
      response.body.sessions.map(
        (session: { id: string }) => session.id
      );

    expect(sessionIds).toContain(
      firstLogin.body.session.id
    );

    expect(sessionIds).toContain(
      secondLogin.body.session.id
    );
  });

  it("rejects session listing without authentication", async () => {
    const response = await request(app)
      .get("/auth/sessions");

    expect(response.status).toBe(401);
  });

  it("revokes one of the user's sessions", async () => {
    const firstLogin =
      await registerAndLogin();

    const secondLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(secondLogin.status).toBe(200);

    const accessToken =
      secondLogin.body.tokens.accessToken;

    const sessionToRevoke =
      firstLogin.body.session.id;

    const response = await request(app)
      .delete(
        `/auth/sessions/${sessionToRevoke}`
      )
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      );

    expect([
      200,
      204,
    ]).toContain(response.status);

    const result = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionToRevoke]
    );

    expect(result.rowCount).toBe(1);

    expect(
      result.rows[0].revoked_at
    ).not.toBeNull();
  });

  it("does not allow a user to revoke another user's session", async () => {
    const firstUserLogin =
      await registerAndLogin();

    const secondUserData = {
      email: "other@example.com",
      password: "Password123",
    };

    const secondRegister =
      await request(app)
        .post("/auth/register")
        .send(secondUserData);

    expect(secondRegister.status).toBe(201);

    const secondLogin =
      await request(app)
        .post("/auth/login")
        .send(secondUserData);

    expect(secondLogin.status).toBe(200);

    const response = await request(app)
      .delete(
        `/auth/sessions/${firstUserLogin.body.session.id}`
      )
      .set(
        "Authorization",
        `Bearer ${secondLogin.body.tokens.accessToken}`
      );

    expect(response.status).toBe(204);

    const result = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [firstUserLogin.body.session.id]
    );

    expect(
      result.rows[0].revoked_at
    ).toBeNull();
  });

  it("logs out the current session", async () => {
    const loginResponse =
      await registerAndLogin();

    const accessToken =
      loginResponse.body.tokens.accessToken;

    const refreshToken =
      loginResponse.body.tokens.refreshToken;

    const sessionId =
      loginResponse.body.session.id;

    const response = await request(app)
      .post("/auth/logout")
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      )
      .send({
        refreshToken,
      });

    expect([
      200,
      204,
    ]).toContain(response.status);

    const result = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionId]
    );

    expect(
      result.rows[0].revoked_at
    ).not.toBeNull();

    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken,
      });

    expect(refreshResponse.status).toBe(401);
  });

  it("logs out all user sessions", async () => {
    const firstLogin =
      await registerAndLogin();

    const secondLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(secondLogin.status).toBe(200);

    const thirdLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(thirdLogin.status).toBe(200);

    const accessToken =
      thirdLogin.body.tokens.accessToken;

    const response = await request(app)
      .post("/auth/logout-all")
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      );

    expect([
      200,
      204,
    ]).toContain(response.status);

    const userId =
      thirdLogin.body.user.id;

    const result = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE user_id = $1
      `,
      [userId]
    );

    expect(result.rowCount).toBe(3);

    for (const session of result.rows) {
      expect(
        session.revoked_at
      ).not.toBeNull();
    }

    const refreshTokens = [
      firstLogin.body.tokens.refreshToken,
      secondLogin.body.tokens.refreshToken,
      thirdLogin.body.tokens.refreshToken,
    ];

    for (const refreshToken of refreshTokens) {
      const refreshResponse =
        await request(app)
          .post("/auth/refresh")
          .send({
            refreshToken,
          });

      expect(
        refreshResponse.status
      ).toBe(401);
    }
  });
});