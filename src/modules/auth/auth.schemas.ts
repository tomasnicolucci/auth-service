import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8)
    .max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1)
    .max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1),
});

export type RefreshInput = z.infer<typeof refreshSchema>;