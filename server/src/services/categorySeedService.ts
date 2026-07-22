import { Category } from "../models/Category";

const systemCategories = [
  ["income.salary", "salario", "income", "briefcase", "lime"],
  ["income.freelance", "freelance", "income", "laptop", "blue"],
  ["income.sales", "ventas", "income", "shopping-bag", "orange"],
  ["income.gift", "regalo", "income", "gift", "purple"],
  ["income.scholarship", "beca", "income", "book", "blue"],
  ["income.commission", "comisión", "income", "receipt", "lime"],
  ["income.rent", "alquiler", "income", "home", "orange"],
  ["income.prize", "premio", "income", "award", "purple"],
  ["income.transfers", "transferencias", "income", "repeat", "black"],
  ["income.refund", "devolución", "income", "rotate-ccw", "lime"],
  ["income.other", "otros ingresos", "income", "circle", "gray"],
  ["expense.food", "comida", "expense", "utensils", "orange"],
  ["expense.transport", "transporte", "expense", "bus", "blue"],
  ["expense.home_services", "hogar y servicios", "expense", "home", "gray"],
  ["expense.health", "salud", "expense", "heart-pulse", "lime"],
  ["expense.education", "educación", "expense", "book", "black"],
  ["expense.shopping", "compras", "expense", "bag", "orange"],
  ["expense.leisure", "ocio", "expense", "ticket", "purple"],
  ["expense.subscriptions", "suscripciones", "expense", "refresh-cw", "purple"],
  ["expense.pets", "mascotas", "expense", "paw-print", "lime"],
  ["expense.gifts", "regalos", "expense", "gift", "blue"],
  ["expense.other", "otros", "expense", "grid-2x2", "gray"]
] as const;

export async function ensureSystemCategories() {
  const activeExpenseKeys = systemCategories.filter(([, , type]) => type === "expense").map(([translationKey]) => translationKey);
  await Category.updateMany({ type: "expense", isSystem: true, userId: null, translationKey: { $nin: activeExpenseKeys } }, { $set: { isActive: false } });
  await Promise.all(
    systemCategories.map(([translationKey, name, type, icon, color]) =>
      Category.updateOne(
        { translationKey, type, isSystem: true, userId: null },
        { $set: { name, icon, color, isActive: true }, $setOnInsert: { translationKey, type, isSystem: true, userId: null } },
        { upsert: true }
      )
    )
  );
}

export const essentialAntExpenseCategoryKeys = new Set([
  "expense.home_services",
  "expense.transport",
  "expense.health",
  "expense.education"
]);
