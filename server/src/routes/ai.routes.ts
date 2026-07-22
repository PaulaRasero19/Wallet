import { Router } from "express";
import { chat } from "../controllers/aiController";
import { authenticate } from "../middlewares/authenticate";

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.post("/chat", chat);
