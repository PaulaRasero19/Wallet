import type { Response } from "express";
import type { FinFlowRequest } from "../types/http";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../services/categoryService";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators";
import { objectIdSchema, parseBody } from "../validators/commonValidators";

export async function indexCategories(req: FinFlowRequest, res: Response) {
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  res.json({ categories: await listCategories(req.user!.mongoId, type) });
}

export async function storeCategory(req: FinFlowRequest, res: Response) {
  const body = parseBody(createCategorySchema, req.body);
  res.status(201).json({ category: await createCategory(req.user!.mongoId, body) });
}

export async function patchCategory(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  const body = parseBody(updateCategorySchema, req.body);
  res.json({ category: await updateCategory(req.user!.mongoId, id, body) });
}

export async function destroyCategory(req: FinFlowRequest, res: Response) {
  const id = parseBody(objectIdSchema, req.params.id);
  res.json({ category: await deleteCategory(req.user!.mongoId, id) });
}
