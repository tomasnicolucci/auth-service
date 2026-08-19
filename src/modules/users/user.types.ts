export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  emailVerified: boolean;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}