import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";
import app from "../../app.js";

const userData = {
  email: "test@example.com",
  password: "Password123",
};

const wrongPassword = "WrongPassword123";

const registerUser = async () => {
  const response = await request(app)
    .post("/auth/register")
    .send(userData);

  expect(response.status).toBe(201);
};

describe("Login brute-force protection", () => {
  it("blocks login after 5 failed attempts", async () => {
    await registerUser();

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: wrongPassword,
        });

      expect(response.status).toBe(401);
    }

    const blockedResponse = await request(app)
      .post("/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toMatchObject({
      error:
        "Too many failed login attempts. Please try again later.",
    });
  });

  it("clears failed attempts after a successful login", async () => {
    await registerUser();

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: wrongPassword,
        });

      expect(response.status).toBe(401);
    }

    const successfulLogin = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(successfulLogin.status).toBe(200);

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: wrongPassword,
        });

      expect(response.status).toBe(401);
    }

    const blockedResponse = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(blockedResponse.status).toBe(429);
  });

  it("tracks failed attempts separately by email", async () => {
    await registerUser();

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "unknown@example.com",
          password: wrongPassword,
        });

      expect(response.status).toBe(401);
    }

    const response = await request(app)
      .post("/auth/login")
      .send(userData);

    expect(response.status).toBe(200);
  });

  it("tracks failed attempts separately by IP", async () => {
    await registerUser();

    const firstIp = "192.168.1.10";
    const secondIp = "192.168.1.20";

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app)
        .post("/auth/login")
        .set("X-Forwarded-For", firstIp)
        .send({
          email: userData.email,
          password: wrongPassword,
        });

      expect(response.status).toBe(401);
    }

    const blockedResponse = await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", firstIp)
      .send(userData);

    expect(blockedResponse.status).toBe(429);

    const differentIpResponse = await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", secondIp)
      .send(userData);

    expect(differentIpResponse.status).toBe(200);
  });
});