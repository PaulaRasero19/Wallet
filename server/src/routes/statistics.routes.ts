import { Router } from "express";
import { overview } from "../controllers/statisticsController";
import { authenticate } from "../middlewares/authenticate";

export const statisticsRouter = Router();

statisticsRouter.use(authenticate);
statisticsRouter.get("/overview", overview);
