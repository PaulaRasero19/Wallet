import { Router } from "express";
import { extendedFinance, storeRecurringPayment } from "../controllers/extendedFinanceController";
import { authenticate } from "../middlewares/authenticate";

export const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.get("/extended", extendedFinance);
financeRouter.post("/recurring-payments", storeRecurringPayment);
