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
  sendVerificationEmail,
} from "../../services/mail.service.js";

import app from "../../app.js";

const mockedSendVerificationEmail =
  vi.mocked(sendVerificationEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

const userData = {
  email: "test@example.com",
  password: "Password123",
};

describe("Email verification", () => {
  it("verifies the user's email with a valid token", async () => {
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);

    expect(
      mockedSendVerificationEmail
    ).toHaveBeenCalled();

    const emailData =
      mockedSendVerificationEmail.mock.calls[0][0];

    const verificationToken =
      emailData.token;

    expect(verificationToken).toBeDefined();

    const response = await request(app)
      .post("/auth/verify-email")
      .send({
        token: verificationToken,
      });

    expect(response.status).toBe(204);

    const userResult = await db.query(
      `
        SELECT email_verified
        FROM users
        WHERE email = $1
      `,
      [userData.email]
    );

    expect(
      userResult.rows[0].email_verified
    ).toBe(true);
  });

  it("rejects an invalid verification token", async () => {
    const response = await request(app)
      .post("/auth/verify-email")
      .send({
        token: "invalid-verification-token",
      });

    expect(response.status).toBe(400);
  });

  it("does not allow a verification token to be used twice", async () => {
    await request(app)
      .post("/auth/register")
      .send(userData);

    const emailData =
      mockedSendVerificationEmail.mock.calls[0][0];

    const verificationToken =
      emailData.token;

    const firstResponse = await request(app)
      .post("/auth/verify-email")
      .send({
        token: verificationToken,
      });

    expect(firstResponse.status).toBe(204);

    const secondResponse = await request(app)
      .post("/auth/verify-email")
      .send({
        token: verificationToken,
      });

    expect(secondResponse.status).toBe(400);
  });

  it("rejects an expired verification token", async () => {
    await request(app)
      .post("/auth/register")
      .send(userData);

    const emailData =
      mockedSendVerificationEmail.mock.calls[0][0];

    const verificationToken =
      emailData.token;

    await db.query(
      `
        UPDATE email_verification_tokens
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
      .post("/auth/verify-email")
      .send({
        token: verificationToken,
      });

    expect(response.status).toBe(400);

    const userResult = await db.query(
      `
        SELECT email_verified
        FROM users
        WHERE email = $1
      `,
      [userData.email]
    );

    expect(
      userResult.rows[0].email_verified
    ).toBe(false);
  });

  it("resends the verification email", async () => {
    await request(app)
      .post("/auth/register")
      .send(userData);

    mockedSendVerificationEmail.mockClear();

    const response = await request(app)
      .post("/auth/resend-verification")
      .send({
        email: userData.email,
      });

    expect([
      200,
      202,
      204,
    ]).toContain(response.status);

    expect(
      mockedSendVerificationEmail
    ).toHaveBeenCalledTimes(1);

    expect(
      mockedSendVerificationEmail
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email,
        token: expect.any(String),
      })
    );
  });
});