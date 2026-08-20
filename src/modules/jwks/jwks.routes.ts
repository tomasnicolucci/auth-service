import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { getJwks } from "./jwks.controller.js";

const jwksRouter = Router();

jwksRouter.get("/jwks.json", asyncHandler(getJwks));

export default jwksRouter;