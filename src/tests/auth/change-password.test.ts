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

const newPassword = "NewPassword456";

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

describe("POST /auth/change-password", () => {
  it("changes the password with the correct current password", async () => {
    const loginResponse =
      await registerAndLogin();

    const accessToken =
      loginResponse.body.tokens.accessToken;

    const refreshToken =
      loginResponse.body.tokens.refreshToken;

    const response = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      )
      .send({
        currentPassword: userData.password,
        newPassword,
        refreshToken,
      });

    expect(response.status).toBe(204);

    const oldLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/auth/login")
      .send({
        email: userData.email,
        password: newPassword,
      });

    expect(newLogin.status).toBe(200);
  });

  it("rejects an incorrect current password", async () => {
    const loginResponse =
      await registerAndLogin();

    const response = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.tokens.accessToken}`
      )
      .send({
        currentPassword: "WrongPassword123",
        newPassword,
        refreshToken:
          loginResponse.body.tokens.refreshToken,
      });

    expect(response.status).toBe(401);

    const login = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(login.status).toBe(200);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .post("/auth/change-password")
      .send({
        currentPassword: userData.password,
        newPassword,
        refreshToken: "any-token",
      });

    expect(response.status).toBe(401);
  });

  it("does not allow the current password to be reused", async () => {
    const loginResponse =
      await registerAndLogin();

    const response = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.tokens.accessToken}`
      )
      .send({
        currentPassword: userData.password,
        newPassword: userData.password,
        refreshToken:
          loginResponse.body.tokens.refreshToken,
      });

    expect(response.status).toBe(400);
  });

  it("does not allow a previous password to be reused", async () => {
    const firstLogin =
      await registerAndLogin();

    const firstChange = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${firstLogin.body.tokens.accessToken}`
      )
      .send({
        currentPassword: userData.password,
        newPassword,
        refreshToken:
          firstLogin.body.tokens.refreshToken,
      });

    expect(firstChange.status).toBe(204);

    const secondLogin = await request(app)
      .post("/auth/login")
      .send({
        email: userData.email,
        password: newPassword,
      });

    expect(secondLogin.status).toBe(200);

    const secondChange = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${secondLogin.body.tokens.accessToken}`
      )
      .send({
        currentPassword: newPassword,
        newPassword: userData.password,
        refreshToken:
          secondLogin.body.tokens.refreshToken,
      });

    expect(secondChange.status).toBe(400);
  });

  it("stores the old password in password history", async () => {
    const loginResponse =
      await registerAndLogin();

    const userId =
      loginResponse.body.user.id;

    const response = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.tokens.accessToken}`
      )
      .send({
        currentPassword: userData.password,
        newPassword,
        refreshToken:
          loginResponse.body.tokens.refreshToken,
      });

    expect(response.status).toBe(204);

    const result = await db.query(
      `
        SELECT password_hash
        FROM password_history
        WHERE user_id = $1
      `,
      [userId]
    );

    expect(result.rowCount).toBe(1);

    expect(
      result.rows[0].password_hash
    ).toBeDefined();
  });

  it("revokes other active sessions after changing the password", async () => {
    const firstLogin =
      await registerAndLogin();

    const secondLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(secondLogin.status).toBe(200);

    const userId =
      firstLogin.body.user.id;

    const response = await request(app)
      .post("/auth/change-password")
      .set(
        "Authorization",
        `Bearer ${firstLogin.body.tokens.accessToken}`
      )
      .send({
        currentPassword: userData.password,
        newPassword,
        refreshToken:
          firstLogin.body.tokens.refreshToken,
      });

    expect(response.status).toBe(204);

    const sessions = await db.query(
      `
        SELECT
          id,
          revoked_at
        FROM sessions
        WHERE user_id = $1
      `,
      [userId]
    );

    expect(sessions.rowCount).toBe(2);

    const currentSession =
      sessions.rows.find(
        (session) =>
          session.id ===
          firstLogin.body.session.id
      );

    const otherSession =
      sessions.rows.find(
        (session) =>
          session.id ===
          secondLogin.body.session.id
      );

    expect(currentSession).toBeDefined();
    expect(otherSession).toBeDefined();

    expect(
      currentSession.revoked_at
    ).toBeNull();

    expect(
      otherSession.revoked_at
    ).not.toBeNull();

    const currentRefreshResponse =
      await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken:
            firstLogin.body.tokens.refreshToken,
        });

    expect(
      currentRefreshResponse.status
    ).toBe(200);

    const otherRefreshResponse =
      await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken:
            secondLogin.body.tokens.refreshToken,
        });

    expect(
      otherRefreshResponse.status
    ).toBe(401);
  });
});