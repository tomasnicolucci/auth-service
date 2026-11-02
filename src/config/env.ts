import "dotenv/config";

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const jwtPrivateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
const jwtPublicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;
const jwtIssuer = process.env.JWT_ISSUER;
const jwtAudience = process.env.JWT_AUDIENCE;
const accessTokenTtl = process.env.ACCESS_TOKEN_TTL;
const refreshTokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS);
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT);
const smtpFrom = process.env.SMTP_FROM;
const emailVerificationTtlMinutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES);
const passwordResetTtlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES);
const corsOrigin = process.env.CORS_ORIGIN;
const trustProxy = process.env.TRUST_PROXY === "true";

const serviceSyncEnabled =
  process.env.SERVICE_SYNC_ENABLED === "true";

const serviceSyncUrl = process.env.SERVICE_SYNC_URL;
const serviceSyncSecret = process.env.SERVICE_SYNC_SECRET;

const serviceSyncTimeoutMs = Number(
  process.env.SERVICE_SYNC_TIMEOUT_MS ?? 3000
);

if (!port) {
  throw new Error("PORT environment variable is required");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

if (!jwtPrivateKeyPath) {
  throw new Error("JWT_PRIVATE_KEY_PATH environment variable is required");
}

if (!jwtPublicKeyPath) {
  throw new Error("JWT_PUBLIC_KEY_PATH environment variable is required");
}

if (!jwtIssuer) {
  throw new Error("JWT_ISSUER environment variable is required");
}

if (!jwtAudience) {
  throw new Error("JWT_AUDIENCE environment variable is required");
}

if (!accessTokenTtl) {
  throw new Error("ACCESS_TOKEN_TTL environment variable is required");
}

if (!refreshTokenTtlDays) {
  throw new Error(
    "REFRESH_TOKEN_TTL_DAYS environment variable is required"
  );
}

if (!smtpHost) {
  throw new Error("SMTP_HOST environment variable is required");
}

if (!smtpPort) {
  throw new Error("SMTP_PORT environment variable is required");
}

if (!smtpFrom) {
  throw new Error("SMTP_FROM environment variable is required");
}

if (!emailVerificationTtlMinutes) {
  throw new Error(
    "EMAIL_VERIFICATION_TTL_MINUTES environment variable is required"
  );
}

if (!passwordResetTtlMinutes) {
  throw new Error(
    "PASSWORD_RESET_TTL_MINUTES environment variable is required"
  );
}

if (!corsOrigin) {
  throw new Error(
    "CORS_ORIGIN environment variable is required"
  );
}

if (
  process.env.SERVICE_SYNC_ENABLED !== undefined &&
  !["true", "false"].includes(process.env.SERVICE_SYNC_ENABLED)
) {
  throw new Error(
    "SERVICE_SYNC_ENABLED must be true or false"
  );
}

if (serviceSyncEnabled) {
  if (!serviceSyncUrl) {
    throw new Error("SERVICE_SYNC_URL is required");
  }

  try {
    const url = new URL(serviceSyncUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new Error(
      "SERVICE_SYNC_URL must be a valid HTTP(S) URL"
    );
  }

  if (!serviceSyncSecret || serviceSyncSecret.length < 32) {
    throw new Error(
      "SERVICE_SYNC_SECRET must contain at least 32 characters"
    );
  }

  if (
    !Number.isInteger(serviceSyncTimeoutMs) ||
    serviceSyncTimeoutMs <= 0
  ) {
    throw new Error(
      "SERVICE_SYNC_TIMEOUT_MS must be a positive integer"
    );
  }
}

export const env = {
  port,
  databaseUrl,
  redisUrl,
  jwtPrivateKeyPath,
  jwtPublicKeyPath,
  jwtIssuer,
  jwtAudience,
  accessTokenTtl,
  refreshTokenTtlDays,
  smtpHost,
  smtpPort,
  smtpFrom,
  emailVerificationTtlMinutes,
  passwordResetTtlMinutes,
  corsOrigin,
  trustProxy,
  serviceSyncEnabled,
  serviceSyncUrl,
  serviceSyncSecret,
  serviceSyncTimeoutMs,
};