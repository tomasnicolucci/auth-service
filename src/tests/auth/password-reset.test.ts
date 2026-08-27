import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import request from "supertest";
import { db } from "../../config/database.js";

vi.mock("../../services/mail.service.js", async () => {
  return {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };
});

import {
  sendPasswordResetEmail,
} from "../../services/mail.service.js";

import app from "../../app.js";

const mockedSendPasswordResetEmail =
  vi.mocked(sendPasswordResetEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

const userData = {
  email: "test@example.com",
  password: "Password123",
};

const newPassword = "NewPassword456";

const registerUser = async () => {
  const response = await request(app)
    .post("/auth/register")
    .send(userData);

  expect(response.status).toBe(201);

  return response;
};

const requestPasswordReset = async () => {
  const response = await request(app)
    .post("/auth/forgot-password")
    .send({
      email: userData.email,
    });

  expect(response.status).toBe(202);

  expect(
    mockedSendPasswordResetEmail
  ).toHaveBeenCalledTimes(1);

  const emailData =
    mockedSendPasswordResetEmail.mock.calls[0][0];

  return emailData.token;
};

describe("Password reset", () => {
  it("resets the password with a valid token", async () => {
    await registerUser();

    const token =
      await requestPasswordReset();

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: newPassword,
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

  it("rejects an invalid reset token", async () => {
    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token: "invalid-reset-token",
        password: newPassword,
      });

    expect(response.status).toBe(400);
  });

  it("does not allow a reset token to be used twice", async () => {
    await registerUser();

    const token =
      await requestPasswordReset();

    const firstResponse = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: newPassword,
      });

    expect(firstResponse.status).toBe(204);

    const secondResponse = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: "AnotherPassword789",
      });

    expect(secondResponse.status).toBe(400);
  });

  it("rejects an expired reset token", async () => {
    await registerUser();

    const token =
      await requestPasswordReset();

    await db.query(
      `
        UPDATE password_reset_tokens
        SET expires_at =
          CURRENT_TIMESTAMP - INTERVAL '1 minute'
        WHERE user_id = (
          SELECT id
          FROM users
          WHERE email = $1
        )
      `,
      [userData.email]
    );

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: newPassword,
      });

    expect(response.status).toBe(400);
  });

  it("stores the previous password in password history", async () => {
    const registerResponse =
      await registerUser();

    const userId =
      registerResponse.body.user.id;

    const token =
      await requestPasswordReset();

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: newPassword,
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

  it("does not allow the current password to be reused", async () => {
    await registerUser();

    const token =
      await requestPasswordReset();

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: userData.password,
      });

    expect(response.status).toBe(400);
  });

  it("does not allow a previous password to be reused", async () => {
    await registerUser();

    const firstToken =
      await requestPasswordReset();

    const firstReset = await request(app)
      .post("/auth/reset-password")
      .send({
        token: firstToken,
        password: newPassword,
      });

    expect(firstReset.status).toBe(204);

    /*
     * requestPasswordReset() espera que el mock tenga
     * exactamente una llamada, así que limpiamos solamente
     * el historial del mock antes de pedir el segundo token.
     */
    mockedSendPasswordResetEmail.mockClear();

    const secondToken =
      await requestPasswordReset();

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token: secondToken,
        password: userData.password,
      });

    expect(response.status).toBe(400);
  });

  it("revokes all active sessions after a password reset", async () => {
    const registerResponse =
      await registerUser();

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

    const token =
      await requestPasswordReset();

    const response = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: newPassword,
      });

    expect(response.status).toBe(204);

    const sessions = await db.query(
      `
        SELECT revoked_at
        FROM sessions
        WHERE user_id = $1
      `,
      [userId]
    );

    expect(sessions.rowCount).toBe(2);

    for (const session of sessions.rows) {
      expect(
        session.revoked_at
      ).not.toBeNull();
    }
  });

  it("does not reveal whether an email is registered", async () => {
    const existingUserResponse =
      await registerUser();

    expect(
      existingUserResponse.status
    ).toBe(201);

    const existingEmailResponse =
      await request(app)
        .post("/auth/forgot-password")
        .send({
          email: userData.email,
        });

    const unknownEmailResponse =
      await request(app)
        .post("/auth/forgot-password")
        .send({
          email: "unknown@example.com",
        });

    expect(
      existingEmailResponse.status
    ).toBe(202);

    expect(
      unknownEmailResponse.status
    ).toBe(202);

    expect(
      existingEmailResponse.body
    ).toEqual(
      unknownEmailResponse.body
    );
  });
});