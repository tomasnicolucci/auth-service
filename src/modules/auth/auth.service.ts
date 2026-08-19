import argon2 from "argon2";
import {
  createUser,
  findUserByEmail,
} from "../users/user.repository.js";
import type { RegisterInput } from "./auth.schemas.js";

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const user = await createUser({
    email: input.email,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
};