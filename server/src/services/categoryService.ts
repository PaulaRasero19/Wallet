import { Types } from "mongoose";
import { Category } from "../models/Category";
import { AppError } from "../utils/appError";
import { ensureSystemCategories } from "./categorySeedService";
import { categoryDTO } from "./serializers";

export async function listCategories(userId: Types.ObjectId, type?: string) {
  await ensureSystemCategories();
  const query: Record<string, unknown> = {
    isActive: true,
    $or: [{ isSystem: true, userId: null }, { userId }]
  };
  if (type) query.type = type;
  const categories = await Category.find(query).sort({ isSystem: -1, type: 1, name: 1 });
  return categories.map(categoryDTO);
}

export async function createCategory(userId: Types.ObjectId, input: Record<string, unknown>) {
  const name = String(input.name).trim();
  const type = input.type as "income" | "expense";
  const translationKey = `custom.${userId.toString()}.${name.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, "_")}`;
  let category = await Category.findOne({ userId, translationKey, type });
  if (category) {
    category.name = name;
    category.icon = String(input.icon || "circle");
    category.color = String(input.color || "black");
    category.isActive = true;
    await category.save();
  } else {
    category = await Category.create({ userId, translationKey, name, type, icon: String(input.icon || "circle"), color: String(input.color || "black"), isSystem: false, isActive: true });
  }
  return categoryDTO(category);
}

async function findEditableCategory(userId: Types.ObjectId, id: string) {
  const category = await Category.findOne({ _id: id, userId });
  if (!category) {
    throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
  }
  if (category.isSystem) {
    throw new AppError("Las categorías del sistema no se pueden modificar.", 403, "SYSTEM_CATEGORY_READ_ONLY");
  }
  return category;
}

export async function updateCategory(userId: Types.ObjectId, id: string, input: Record<string, unknown>) {
  const category = await findEditableCategory(userId, id);
  if (input.name) category.name = input.name as string;
  if (input.type) category.type = input.type as "income" | "expense";
  if (input.icon) category.icon = input.icon as string;
  if (input.color) category.color = input.color as string;
  if (typeof input.isActive === "boolean" || typeof input.is_active === "boolean") category.isActive = Boolean(input.isActive ?? input.is_active);
  await category.save();
  return categoryDTO(category);
}

export async function deleteCategory(userId: Types.ObjectId, id: string) {
  const category = await findEditableCategory(userId, id);
  category.isActive = false;
  await category.save();
  return categoryDTO(category);
}
