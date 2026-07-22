import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { createRecurringPayment, getExtendedFinance } from "../services/extendedFinanceService";
import { parseBody } from "../validators/commonValidators";
import { recurringPaymentSchema } from "../validators/financeValidators";

export async function extendedFinance(req: FinFlowRequest, res: Response) {
  const data = await getExtendedFinance(req.user!.mongoId);
  res.json(data);
}

export async function storeRecurringPayment(req: FinFlowRequest, res: Response) {
  const body = parseBody(recurringPaymentSchema, req.body);
  res.status(201).json({ payment: await createRecurringPayment(req.user!.mongoId, body) });
}
