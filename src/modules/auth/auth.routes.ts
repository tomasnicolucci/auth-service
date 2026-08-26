import { Router } from "express";
import { changePasswordController, deleteSession, forgotPasswordController, getSessions, login, logout, logoutAll, me, refresh, register, resendVerification, resetPasswordController, verifyEmail } from "./auth.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, logoutSchema, refreshSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, verifyEmailSchema } from "./auth.schemas.js";
import { authenticate } from "../../middleware/authenticate.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));

authRouter.post("/login", validate(loginSchema), asyncHandler(login));

authRouter.post("/refresh", validate(refreshSchema), asyncHandler(refresh));

authRouter.post("/logout", validate(logoutSchema), asyncHandler(logout));

authRouter.post("/logout-all", asyncHandler(authenticate), asyncHandler(logoutAll));

authRouter.post("/verify-email", validate(verifyEmailSchema), asyncHandler(verifyEmail));

authRouter.post("/resend-verification", validate(resendVerificationSchema), asyncHandler(resendVerification));

authRouter.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(forgotPasswordController));

authRouter.post("/reset-password", validate(resetPasswordSchema), asyncHandler(resetPasswordController));

authRouter.post("/change-password", asyncHandler(authenticate), validate(changePasswordSchema), asyncHandler(changePasswordController));

authRouter.get("/sessions", asyncHandler(authenticate), asyncHandler(getSessions));

authRouter.get("/me", asyncHandler(authenticate), asyncHandler(me));

authRouter.delete("/sessions/:sessionId", asyncHandler(authenticate), asyncHandler(deleteSession));

export default authRouter;