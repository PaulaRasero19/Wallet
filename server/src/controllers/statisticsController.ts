import type { Response } from "express";
import { getOverview } from "../services/statisticsService";
import type { FinFlowRequest } from "../types/http";

export async function overview(req: FinFlowRequest, res: Response) {
  const period = typeof req.query.period === "string" ? req.query.period : "30d";
  res.json({ overview: await getOverview(req.user!.mongoId, period) });
}
