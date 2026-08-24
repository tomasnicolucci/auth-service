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
};