import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { getExtendedFinance } from "../services/extendedFinanceService";

export async function extendedFinance(req: FinFlowRequest, res: Response) {
  const data = await getExtendedFinance(req.user!.mongoId);
  res.json(data);
}
