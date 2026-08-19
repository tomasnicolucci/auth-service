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