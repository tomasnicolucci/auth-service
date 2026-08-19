import { Router } from "express";
import { register } from "./auth.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { registerSchema } from "./auth.schemas.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));

export default authRouter;