import { Router } from "express";
import { login, register } from "./auth.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));

authRouter.post("/login", validate(loginSchema), asyncHandler(login));

export default authRouter;