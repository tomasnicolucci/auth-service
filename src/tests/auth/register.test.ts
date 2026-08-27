import {
    describe,
    expect,
    it,
} from "vitest";

import request from "supertest";
import app from "../../app.js";

const validUser = {
    email: "test@example.com",
    password: "Password123",
};

describe("POST /auth/register", () => {
    it("registers a new user", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send(validUser);

        expect(response.status).toBe(201);

        expect(response.body.user).toMatchObject({
            email: validUser.email,
            role: "user",
            emailVerified: false,
        });

        expect(response.body.user).toHaveProperty(
            "id"
        );

        expect(response.body.user).toHaveProperty(
            "createdAt"
        );

        expect(response.body.user).not.toHaveProperty(
            "passwordHash"
        );
    });

    it("rejects an already registered email", async () => {
        const firstResponse = await request(app)
            .post("/auth/register")
            .send(validUser);

        expect(firstResponse.status).toBe(201);

        const response = await request(app)
            .post("/auth/register")
            .send(validUser);

        expect(response.status).toBe(409);
    });

    it("rejects a password that does not meet the policy", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "test@example.com",
                password: "123",
            });

        expect(response.status).toBe(400);
    });

    it("rejects an invalid email", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "not-an-email",
                password: "Password123",
            });

        expect(response.status).toBe(400);
    });

    it("rejects missing required fields", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "test@example.com",
            });

        expect(response.status).toBe(400);
    });
});