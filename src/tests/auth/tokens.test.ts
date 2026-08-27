import {
    describe,
    expect,
    it,
} from "vitest";

import request from "supertest";
import {
    decodeProtectedHeader,
    decodeJwt,
    importJWK,
    jwtVerify,
} from "jose";

import app from "../../app.js";

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

describe("Access tokens and JWKS", () => {
    it("returns the authenticated user from /auth/me", async () => {
        const loginResponse =
            await registerAndLogin();

        const accessToken =
            loginResponse.body.tokens.accessToken;

        const response = await request(app)
            .get("/auth/me")
            .set(
                "Authorization",
                `Bearer ${accessToken}`
            );

        expect(response.status).toBe(200);

        expect(response.body.user).toMatchObject({
            userId: loginResponse.body.user.id,
            email: userData.email,
            role: "user",
        });
    });

    it("rejects /auth/me without an access token", async () => {
        const response = await request(app)
            .get("/auth/me");

        expect(response.status).toBe(401);
    });

    it("rejects a modified access token", async () => {
        const loginResponse =
            await registerAndLogin();

        const accessToken =
            loginResponse.body.tokens.accessToken;

        const modifiedToken =
            accessToken.slice(0, -1) +
            (
                accessToken.endsWith("a")
                    ? "b"
                    : "a"
            );

        const response = await request(app)
            .get("/auth/me")
            .set(
                "Authorization",
                `Bearer ${modifiedToken}`
            );

        expect(response.status).toBe(401);
    });

    it("creates an access token with the expected claims", async () => {
        const loginResponse =
            await registerAndLogin();

        const accessToken =
            loginResponse.body.tokens.accessToken;

        const payload = decodeJwt(accessToken);

        expect(payload.sub).toBe(
            loginResponse.body.user.id
        );

        expect(payload.email).toBe(
            userData.email
        );

        expect(payload.role).toBe("user");

        expect(payload.iss).toBe(
            "auth-service"
        );

        expect(payload.aud).toBe(
            "backend-services"
        );

        expect(payload.iat).toBeDefined();
        expect(payload.exp).toBeDefined();
        expect(payload.jti).toBeDefined();
    });

    it("creates an RS256 token with the expected key id", async () => {
        const loginResponse =
            await registerAndLogin();

        const accessToken =
            loginResponse.body.tokens.accessToken;

        const header =
            decodeProtectedHeader(accessToken);

        expect(header.alg).toBe("RS256");
        expect(header.typ).toBe("JWT");
        expect(header.kid).toBe(
            "auth-service-key-1"
        );
    });

    it("publishes the public key through JWKS", async () => {
        const response = await request(app)
            .get("/.well-known/jwks.json");

        expect(response.status).toBe(200);

        expect(response.body.keys).toHaveLength(1);

        expect(response.body.keys[0]).toMatchObject({
            kty: "RSA",
            kid: "auth-service-key-1",
            use: "sig",
            alg: "RS256",
        });

        expect(response.body.keys[0]).toHaveProperty(
            "n"
        );

        expect(response.body.keys[0]).toHaveProperty(
            "e"
        );

        expect(
            response.body.keys[0]
        ).not.toHaveProperty("d");
    });

    it("allows another service to verify the JWT using only the JWKS public key", async () => {
        const loginResponse =
            await registerAndLogin();

        const accessToken =
            loginResponse.body.tokens.accessToken;

        const jwksResponse = await request(app)
            .get("/.well-known/jwks.json");

        expect(jwksResponse.status).toBe(200);

        const jwk =
            jwksResponse.body.keys[0];

        const publicKey = await importJWK(
            jwk,
            "RS256"
        );

        const { payload } = await jwtVerify(
            accessToken,
            publicKey,
            {
                issuer: "auth-service",
                audience: "backend-services",
                algorithms: ["RS256"],
            }
        );

        expect(payload.sub).toBe(
            loginResponse.body.user.id
        );

        expect(payload.email).toBe(
            userData.email
        );
    });
});