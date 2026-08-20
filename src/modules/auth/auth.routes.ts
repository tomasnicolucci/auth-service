import { Router } from "express";
import { login, me, refresh, register } from "./auth.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas.js";
import { authenticate } from "../../middleware/authenticate.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));

authRouter.post("/login", validate(loginSchema), asyncHandler(login));

authRouter.post("/refresh", validate(refreshSchema), asyncHandler(refresh));

authRouter.get("/me", asyncHandler(authenticate), asyncHandler(me));

export default authRouter;