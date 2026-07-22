import type { Response } from "express";
import { answerFinancialQuestion } from "../services/aiService";
import type { FinFlowRequest } from "../types/http";
import { parseBody } from "../validators/commonValidators";
import { aiChatSchema } from "../validators/aiValidators";

export async function chat(req: FinFlowRequest, res: Response) {
  const body = parseBody(aiChatSchema, req.body);
  res.json(await answerFinancialQuestion(req.user!.mongoId, body.message));
}
