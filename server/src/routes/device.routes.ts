import { Router } from "express";
import { destroyPushToken, storePushToken } from "../controllers/deviceController";
import { authenticate } from "../middlewares/authenticate";

export const deviceRouter = Router();

deviceRouter.use(authenticate);
deviceRouter.post("/push-token", storePushToken);
deviceRouter.delete("/push-token", destroyPushToken);
