import { Router } from "express";
import { changeGoal, completeInstallment, completeRecurringPayment, contributeToGoal, destroyGoal, extendedFinance, storeGoal, storeInstallmentPurchase, storeRecurringPayment } from "../controllers/extendedFinanceController";
import { authenticate } from "../middlewares/authenticate";

export const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.get("/extended", extendedFinance);
financeRouter.post("/recurring-payments", storeRecurringPayment);
financeRouter.post("/recurring-payments/:id/pay", completeRecurringPayment);
financeRouter.post("/goals", storeGoal);
financeRouter.post("/goals/:id/contributions", contributeToGoal);
financeRouter.patch("/goals/:id", changeGoal);
financeRouter.delete("/goals/:id", destroyGoal);
financeRouter.post("/installment-purchases", storeInstallmentPurchase);
financeRouter.post("/installment-purchases/:purchaseId/installments/:installmentId/pay", completeInstallment);
