import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { addMoneyToGoal, createGoal, createInstallmentPurchase, createRecurringPayment, getExtendedFinance, markInstallmentPaid, markRecurringPaymentPaid } from "../services/extendedFinanceService";
import { objectIdSchema, parseBody } from "../validators/commonValidators";
import { goalContributionSchema, goalSchema, installmentPurchaseSchema, recurringPaymentSchema } from "../validators/financeValidators";

export async function extendedFinance(req: FinFlowRequest, res: Response) {
  const data = await getExtendedFinance(req.user!.mongoId);
  res.json(data);
}

export async function storeRecurringPayment(req: FinFlowRequest, res: Response) {
  const body = parseBody(recurringPaymentSchema, req.body);
  res.status(201).json({ payment: await createRecurringPayment(req.user!.mongoId, body) });
}

export async function storeGoal(req: FinFlowRequest, res: Response) {
  const body = parseBody(goalSchema, req.body);
  res.status(201).json({ goal: await createGoal(req.user!.mongoId, body) });
}

export async function contributeToGoal(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  const body = parseBody(goalContributionSchema, req.body);
  res.json({ goal: await addMoneyToGoal(req.user!.mongoId, id, body.amount) });
}

export async function storeInstallmentPurchase(req: FinFlowRequest, res: Response) {
  const body = parseBody(installmentPurchaseSchema, req.body);
  res.status(201).json({ purchase: await createInstallmentPurchase(req.user!.mongoId, body) });
}

export async function completeRecurringPayment(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json(await markRecurringPaymentPaid(req.user!.mongoId, id));
}

export async function completeInstallment(req: FinFlowRequest, res: Response) {
  const purchaseId = parseBody(objectIdSchema, req.params.purchaseId);
  const installmentId = parseBody(objectIdSchema, req.params.installmentId);
  res.json({ purchase: await markInstallmentPaid(req.user!.mongoId, purchaseId, installmentId) });
}
