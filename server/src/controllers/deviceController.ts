import type { Response } from "express";
import { deactivateDeviceToken, registerDeviceToken } from "../services/notificationService";
import type { FinFlowRequest } from "../types/http";
import { parseBody } from "../validators/commonValidators";
import { pushTokenSchema } from "../validators/notificationValidators";

export async function storePushToken(req: FinFlowRequest, res: Response) {
  const body = parseBody(pushTokenSchema, req.body);
  await registerDeviceToken(req.user!.mongoId, body);
  res.status(201).json({ ok: true });
}

export async function destroyPushToken(req: FinFlowRequest, res: Response) {
  const body = parseBody(pushTokenSchema, req.body);
  await deactivateDeviceToken(req.user!.mongoId, body.token);
  res.json({ ok: true });
}
