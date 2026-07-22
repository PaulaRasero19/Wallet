import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { parseBody } from "../validators/commonValidators";
import { onboardingSchema, profileUpdateSchema } from "../validators/profileValidators";
import { completeOnboardingForUser, getProfileForUser, patchProfileForUser } from "../services/profileService";

export async function getProfile(req: FinFlowRequest, res: Response) {
  res.json({ profile: await getProfileForUser(req.user!.mongoId) });
}

export async function patchProfile(req: FinFlowRequest, res: Response) {
  const body = parseBody(profileUpdateSchema, req.body);
  res.json({ profile: await patchProfileForUser(req.user!.mongoId, body) });
}

export async function completeOnboarding(req: FinFlowRequest, res: Response) {
  const body = parseBody(onboardingSchema, req.body);
  res.json(await completeOnboardingForUser(req.user!.mongoId, body));
}
