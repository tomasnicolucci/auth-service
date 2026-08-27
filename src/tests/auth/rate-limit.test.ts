import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";
import app from "../../app.js";
import { rateLimits } from "../../config/rateLimits.js";

describe("HTTP rate limiting", () => {
  it("rate limits the login endpoint", async () => {
    for (
      let attempt = 0;
      attempt < rateLimits.login.maxRequests;
      attempt++
    ) {
      const response = await request(app)
        .post("/auth/login")
        .send({});

      expect(response.status).toBe(400);
    }

    const blockedResponse = await request(app)
      .post("/auth/login")
      .send({});

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toEqual({
      error:
        "Too many requests. Please try again later.",
    });
  });

  it("rate limits the register endpoint", async () => {
    for (
      let attempt = 0;
      attempt < rateLimits.register.maxRequests;
      attempt++
    ) {
      const response = await request(app)
        .post("/auth/register")
        .send({});

      expect(response.status).toBe(400);
    }

    const blockedResponse = await request(app)
      .post("/auth/register")
      .send({});

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toEqual({
      error:
        "Too many requests. Please try again later.",
    });
  });

  it("rate limits the forgot-password endpoint", async () => {
    for (
      let attempt = 0;
      attempt <
      rateLimits.forgotPassword.maxRequests;
      attempt++
    ) {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({});

      expect(response.status).toBe(400);
    }

    const blockedResponse = await request(app)
      .post("/auth/forgot-password")
      .send({});

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toEqual({
      error:
        "Too many requests. Please try again later.",
    });
  });

  it("rate limits the resend-verification endpoint", async () => {
    for (
      let attempt = 0;
      attempt <
      rateLimits.resendVerification.maxRequests;
      attempt++
    ) {
      const response = await request(app)
        .post("/auth/resend-verification")
        .send({});

      expect(response.status).toBe(400);
    }

    const blockedResponse = await request(app)
      .post("/auth/resend-verification")
      .send({});

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toEqual({
      error:
        "Too many requests. Please try again later.",
    });
  });

  it("tracks rate limits separately by IP", async () => {
    const firstIp = "192.168.1.10";
    const secondIp = "192.168.1.20";

    for (
      let attempt = 0;
      attempt < rateLimits.register.maxRequests;
      attempt++
    ) {
      const response = await request(app)
        .post("/auth/register")
        .set("X-Forwarded-For", firstIp)
        .send({});

      expect(response.status).toBe(400);
    }

    const blockedResponse = await request(app)
      .post("/auth/register")
      .set("X-Forwarded-For", firstIp)
      .send({});

    expect(blockedResponse.status).toBe(429);

    const differentIpResponse = await request(app)
      .post("/auth/register")
      .set("X-Forwarded-For", secondIp)
      .send({});

    expect(differentIpResponse.status).toBe(400);
  });
});