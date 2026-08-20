export interface Session {
  id: string;
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipHash: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}