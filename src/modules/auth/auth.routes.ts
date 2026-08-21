import { Router } from "express";
import { deleteSession, getSessions, login, logout, logoutAll, me, refresh, register, verifyEmail } from "./auth.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema, verifyEmailSchema } from "./auth.schemas.js";
import { authenticate } from "../../middleware/authenticate.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));

authRouter.post("/login", validate(loginSchema), asyncHandler(login));

authRouter.post("/refresh", validate(refreshSchema), asyncHandler(refresh));

authRouter.get("/me", asyncHandler(authenticate), asyncHandler(me));

authRouter.post("/logout", validate(logoutSchema), asyncHandler(logout));

authRouter.post("/logout-all", asyncHandler(authenticate), asyncHandler(logoutAll));

authRouter.get("/sessions", asyncHandler(authenticate), asyncHandler(getSessions));

authRouter.delete("/sessions/:sessionId", asyncHandler(authenticate), asyncHandler(deleteSession));

authRouter.post("/verify-email", validate(verifyEmailSchema), asyncHandler(verifyEmail));

export default authRouter;