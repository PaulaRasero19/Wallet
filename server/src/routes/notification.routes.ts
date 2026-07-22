import { Router } from "express";
import { complete, indexNotifications, readAllNotifications, readNotification, snooze } from "../controllers/notificationController";
import { authenticate } from "../middlewares/authenticate";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", indexNotifications);
notificationRouter.patch("/read-all", readAllNotifications);
notificationRouter.patch("/:id/read", readNotification);
notificationRouter.post("/:id/snooze", snooze);
notificationRouter.post("/:id/complete", complete);
