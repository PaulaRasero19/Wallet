import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { createTransaction, createTransfer, deleteTransaction, getTransaction, listTransactions, updateTransaction } from "../services/transactionService";
import { objectIdSchema, parseBody } from "../validators/commonValidators";
import { createTransactionSchema, transactionQuerySchema, transferTransactionSchema, updateTransactionSchema } from "../validators/transactionValidators";

export async function indexTransactions(req: FinFlowRequest, res: Response) {
  const query = parseBody(transactionQuerySchema, req.query);
  res.json(await listTransactions(req.user!.mongoId, query));
}

export async function storeTransaction(req: FinFlowRequest, res: Response) {
  const body = parseBody(createTransactionSchema, req.body);
  res.status(201).json(await createTransaction(req.user!.mongoId, body));
}

export async function storeTransfer(req: FinFlowRequest, res: Response) {
  const body = parseBody(transferTransactionSchema, req.body);
  res.status(201).json(await createTransfer(req.user!.mongoId, body));
}

export async function showTransaction(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ transaction: await getTransaction(req.user!.mongoId, id) });
}

export async function patchTransaction(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  const body = parseBody(updateTransactionSchema, req.body);
  res.json(await updateTransaction(req.user!.mongoId, id, body));
}

export async function destroyTransaction(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json(await deleteTransaction(req.user!.mongoId, id));
}
