import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(
    8,
    "Password must contain at least 8 characters"
  )
  .max(
    128,
    "Password must contain at most 128 characters"
  );