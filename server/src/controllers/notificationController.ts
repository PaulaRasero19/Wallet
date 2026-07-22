import type { Response } from "express";
import {
  completeNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification
} from "../services/notificationService";
import type { FinFlowRequest } from "../types/http";
import { objectIdSchema, parseBody } from "../validators/commonValidators";
import { notificationQuerySchema } from "../validators/notificationValidators";

export async function indexNotifications(req: FinFlowRequest, res: Response) {
  const query = parseBody(notificationQuerySchema, req.query);
  res.json({ notifications: await listNotifications(req.user!.mongoId, query.status) });
}

export async function readNotification(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ notification: await markNotificationRead(req.user!.mongoId, id) });
}

export async function readAllNotifications(req: FinFlowRequest, res: Response) {
  await markAllNotificationsRead(req.user!.mongoId);
  res.json({ ok: true });
}

export async function snooze(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ notification: await snoozeNotification(req.user!.mongoId, id) });
}

export async function complete(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ notification: await completeNotification(req.user!.mongoId, id) });
}
