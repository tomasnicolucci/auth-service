# Auth Service

A reusable authentication and session management microservice built with Node.js, TypeScript, Express, PostgreSQL, Redis, and Docker.

The service is responsible for user identity, credentials, authentication, token issuance, session management, email verification, and password recovery. Other backend services can validate access tokens independently through the public JWKS endpoint without sharing the authentication service's private signing key.

## Features

- User registration
- Secure password hashing with Argon2id
- Login with email and password
- RSA-signed JWT access tokens using RS256
- Public JWKS endpoint for downstream services
- Opaque refresh tokens
- Refresh token rotation
- Refresh token reuse detection
- Persistent session management
- List active sessions
- Revoke individual sessions
- Logout and logout from all sessions
- Email verification
- Resend email verification
- Forgot-password flow
- Password reset with one-time tokens
- Authenticated password changes
- Password history and password reuse prevention
- Login brute-force protection using Redis
- General HTTP rate limiting
- Request validation with Zod
- PostgreSQL transactions for sensitive operations
- Health and readiness endpoints
- OpenAPI / Swagger documentation
- Docker Compose development environment
- Integration tests with Vitest and Supertest
- Graceful shutdown

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **Cache / security state:** Redis
- **Validation:** Zod
- **Password hashing:** Argon2id
- **JWT / JWK:** jose
- **Email:** Nodemailer
- **Development mail server:** Mailpit
- **Database migrations:** node-pg-migrate
- **Testing:** Vitest + Supertest
- **Containers:** Docker + Docker Compose
- **API documentation:** OpenAPI 3 + Swagger UI

## Architecture

The application follows a layered, module-oriented architecture.

```text
HTTP Request
     |
     v
Routes
     |
     v
Validation / Authentication Middleware
     |
     v
Controllers
     |
     v
Services
     |
     v
Repositories
     |
     v
PostgreSQL / Redis
```

## Authentication Flow

### Registration

```text
Client
  |
  | POST /auth/register
  v
Auth Service
  |
  |-- validates input
  |-- hashes password with Argon2id
  |-- creates user
  |-- generates email verification token
  |-- stores only the token hash
  |
  v
Verification email
```

The raw verification token is sent to the user. Only its hash is persisted in the database.

### Login

```text
Client
  |
  | email + password
  v
Auth Service
  |
  |-- checks brute-force protection
  |-- verifies credentials
  |-- creates session
  |-- signs access token with private RSA key
  |-- generates opaque refresh token
  |
  v
Access Token + Refresh Token
```

Failed login attempts are tracked using Redis by email and IP address.

A successful login clears the corresponding failed-login counter.

## Access and Refresh Tokens

The service uses two different token types.

### Access Token

Access tokens are JWTs signed using:

```text
RS256
```

The private RSA key exists only in the Auth Service.

Access tokens contain authentication identity information and are designed to be short-lived.

Typical claims include:

```text
sub   -> user ID
email -> authenticated email
role  -> current identity role claim
iss   -> auth-service
aud   -> backend-services
jti   -> unique token identifier
iat   -> issued-at time
exp   -> expiration time
```

The JWT protected header includes a key identifier (`kid`) so verifiers can select the correct public key.

### Refresh Token

Refresh tokens are opaque cryptographically secure random values.

The raw refresh token is returned to the client, while only its SHA-256 hash is stored by the service.

Each refresh token is associated with a persistent session.

When a refresh token is used successfully:

```text
Current refresh token
        |
        v
Validate session
        |
        v
Store old token hash in history
        |
        v
Generate new refresh token
        |
        v
Update session
        |
        v
New access + refresh tokens
```

If an already-rotated refresh token is presented again, the service detects token reuse and revokes the affected session.

## Session Management

Sessions provide server-side control over refresh tokens while keeping access-token validation stateless.

A login creates a session containing information such as:

- Current refresh-token hash
- Creation time
- Last-use time
- Expiration
- Revocation state
- Client metadata

Available session operations include:

```http
GET /auth/sessions
DELETE /auth/sessions/{sessionId}
POST /auth/logout
POST /auth/logout-all
```

Revoking a session prevents it from obtaining new access tokens.

An access token that has already been issued remains valid until its expiration unless a resource server implements additional stateful revocation checks.

## Password Security

Passwords are hashed with Argon2id before being stored.

The service also maintains password history.

When a password is changed or reset, the service verifies that the new password is not:

- The current password
- A previously used password stored in password history

Sensitive password operations use PostgreSQL transactions so related changes either complete together or roll back together.

A password change preserves the current session while revoking the user's other active sessions.

A password reset revokes existing sessions.

## Email Verification

Registration generates a cryptographically secure one-time verification token.

```text
Raw token -> email
SHA-256 hash -> database
```

Verification tokens:

- Expire after a configured period
- Can only be used once
- Are validated using their stored hash

Verification emails can be resent through a rate-limited endpoint.

## Password Reset

The forgot-password endpoint does not reveal whether an email address exists.

If the account exists, the service creates a secure reset token and sends it by email.

Only the token hash is persisted.

A valid reset:

1. Validates and locks the reset token.
2. Checks token expiration and previous use.
3. Verifies password history.
4. Stores the previous password hash.
5. Updates the password.
6. Marks the reset token as used.
7. Invalidates other reset tokens.
8. Revokes existing sessions.

These operations are performed transactionally.

## Security

The service implements several security controls:

### Password hashing

Passwords are never stored in plaintext and are hashed using Argon2id.

### Asymmetric JWT signing

Access tokens are signed using an RSA private key.

Only the public key is exposed to other services.

### Refresh token hashing

Raw refresh tokens are not stored in PostgreSQL.

### One-time token hashing

Email-verification and password-reset tokens are stored only as hashes.

### Refresh token rotation

Every successful refresh replaces the previous refresh token.

### Refresh token reuse detection

Previously rotated tokens are tracked so reuse can be detected and the session revoked.

### Brute-force protection

Failed login attempts are tracked in Redis using a key derived from the email address and IP address.

### HTTP rate limiting

Sensitive endpoints have independent Redis-backed request limits, including:

- Login
- Registration
- Forgot password
- Resend verification

### Input validation

Request bodies are validated with Zod before reaching business logic.

### HTTP security

The Express application uses Helmet and configured CORS rules.

### Secret handling

Private keys and environment files are excluded from Docker images.

RSA keys are mounted into the application container as read-only files.

## JWKS and Integration with Other Services

The public JSON Web Key Set is available at:

```http
GET /.well-known/jwks.json
```

It exposes the public RSA signing key.

It does **not** expose the private key.

A downstream service can therefore validate an access token without calling the Auth Service for every authenticated request.

```text
                    Auth Service
                         |
                signs JWT with
                   private key
                         |
                         v
                       Client
                         |
                    Access Token
                         |
                         v
                Backend Service
                         |
               obtains/caches JWKS
                         |
                         v
               verifies JWT locally
                  with public key
```

A resource service should validate at least:

- Signature
- Algorithm
- Issuer
- Audience
- Expiration

The expected values are:

```text
Algorithm: RS256
Issuer: auth-service
Audience: backend-services
Key ID: auth-service-key-1
```

This keeps authentication centralized while allowing resource services to remain independent during normal authenticated requests.

Business-specific authorization should remain in the service that owns that business domain rather than coupling every domain role to the Auth Service.

## API Endpoints

### Authentication

| Method | Endpoint | Authentication |
| --- | --- | --- |
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | Refresh token |
| POST | `/auth/logout-all` | Bearer token |
| GET | `/auth/me` | Bearer token |
| POST | `/auth/verify-email` | No |
| POST | `/auth/resend-verification` | No |
| POST | `/auth/forgot-password` | No |
| POST | `/auth/reset-password` | No |
| POST | `/auth/change-password` | Bearer token |

### Sessions

| Method | Endpoint | Authentication |
| --- | --- | --- |
| GET | `/auth/sessions` | Bearer token |
| DELETE | `/auth/sessions/{sessionId}` | Bearer token |

### Infrastructure

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/ready` | Dependency readiness check |
| GET | `/.well-known/jwks.json` | Public JWT verification keys |
| GET | `/docs` | Swagger UI |

## API Documentation

Interactive OpenAPI documentation is available while the service is running:

```text
http://localhost:3000/docs
```

Swagger UI can also authenticate against protected endpoints.



## Running with Docker

### Requirements

Install:

- Docker
- Docker Compose

### Environment

Create a local `.env` file based on:

```text
.env.example
```

Generate or provide the RSA key pair expected by the service:

```text
keys/
├── private.pem
└── public.pem
```

Do not share the private key.

### Start the environment

```bash
docker compose up --build
```

The Auth Service waits for PostgreSQL and Redis health checks before starting.

Database migrations are applied before the application process starts.

## Database Migrations

Apply migrations locally:

```bash
npm run migrate up
```

Roll back the latest migration:

```bash
npm run migrate down
```

When the service runs through Docker Compose, pending migrations are applied before the application starts.

## Local Development

Install dependencies:

```bash
npm i
```

Start the required infrastructure:

```bash
docker compose up -d
```

Start the API in development mode:

```bash
npm run dev
```

Build the TypeScript project:

```bash
npm run build
```

Run the compiled application:

```bash
npm start
```

## Testing

The project uses Vitest and Supertest for integration testing.

Run the complete test suite:

```bash
npm test
```

The test environment uses isolated PostgreSQL and Redis configuration.

Tests reset database state and Redis state between cases to prevent cross-test contamination.

The suite covers the main authentication and security flows, including:

- Registration
- Login
- Refresh token rotation
- Refresh token reuse detection
- Session management
- Email verification
- Password reset
- Password changes
- Password history
- Login brute-force protection
- General HTTP rate limiting
- JWT validation
- JWKS publication
- Downstream-style JWT verification