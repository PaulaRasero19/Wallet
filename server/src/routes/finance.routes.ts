import { Router } from "express";
import { completeInstallment, completeRecurringPayment, extendedFinance, storeGoal, storeInstallmentPurchase, storeRecurringPayment } from "../controllers/extendedFinanceController";
import { authenticate } from "../middlewares/authenticate";

export const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.get("/extended", extendedFinance);
financeRouter.post("/recurring-payments", storeRecurringPayment);
financeRouter.post("/recurring-payments/:id/pay", completeRecurringPayment);
financeRouter.post("/goals", storeGoal);
financeRouter.post("/installment-purchases", storeInstallmentPurchase);
financeRouter.post("/installment-purchases/:purchaseId/installments/:installmentId/pay", completeInstallment);
