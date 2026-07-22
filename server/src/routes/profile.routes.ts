import { Router } from "express";
import { completeOnboarding, getProfile, patchProfile } from "../controllers/profileController";
import { authenticate } from "../middlewares/authenticate";

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get("/", getProfile);
profileRouter.patch("/", patchProfile);
profileRouter.post("/onboarding", completeOnboarding);
