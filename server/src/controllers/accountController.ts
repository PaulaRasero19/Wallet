import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { createAccount, deleteAccount, getAccount, listAccounts, updateAccount } from "../services/accountService";
import { createAccountSchema, updateAccountSchema } from "../validators/accountValidators";
import { objectIdSchema, parseBody } from "../validators/commonValidators";

export async function indexAccounts(req: FinFlowRequest, res: Response) {
  res.json({ accounts: await listAccounts(req.user!.mongoId) });
}

export async function storeAccount(req: FinFlowRequest, res: Response) {
  const body = parseBody(createAccountSchema, req.body);
  res.status(201).json({ account: await createAccount(req.user!.mongoId, body) });
}

export async function showAccount(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ account: await getAccount(req.user!.mongoId, id) });
}

export async function patchAccount(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  const body = parseBody(updateAccountSchema, req.body);
  res.json({ account: await updateAccount(req.user!.mongoId, id, body) });
}

export async function destroyAccount(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ account: await deleteAccount(req.user!.mongoId, id) });
}
