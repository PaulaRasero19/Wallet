import { Category } from "../models/Category";

const systemCategories = [
  ["income.salary", "salario", "income", "briefcase", "lime"],
  ["income.freelance", "freelance", "income", "laptop", "blue"],
  ["income.sales", "ventas", "income", "shopping-bag", "orange"],
  ["income.transfers", "transferencias", "income", "repeat", "black"],
  ["income.refund", "devolución", "income", "rotate-ccw", "lime"],
  ["income.other", "otros ingresos", "income", "circle", "gray"],
  ["expense.rent", "alquiler", "expense", "home", "black"],
  ["expense.common_expenses", "gastos comunes", "expense", "building", "gray"],
  ["expense.supermarket", "supermercado", "expense", "shopping-cart", "lime"],
  ["expense.food", "comida", "expense", "utensils", "orange"],
  ["expense.delivery", "delivery", "expense", "bike", "orange"],
  ["expense.transport", "transporte", "expense", "bus", "blue"],
  ["expense.stm", "STM", "expense", "bus-front", "blue"],
  ["expense.ute", "UTE", "expense", "zap", "yellow"],
  ["expense.ose", "OSE", "expense", "droplets", "blue"],
  ["expense.antel", "Antel", "expense", "wifi", "blue"],
  ["expense.mutualista", "mutualista", "expense", "heart-pulse", "lime"],
  ["expense.health", "salud", "expense", "heart", "lime"],
  ["expense.education", "educación", "expense", "book", "black"],
  ["expense.shopping", "compras", "expense", "bag", "orange"],
  ["expense.entertainment", "entretenimiento", "expense", "ticket", "purple"],
  ["expense.subscriptions", "suscripciones", "expense", "refresh-cw", "purple"],
  ["expense.savings", "ahorro", "expense", "piggy-bank", "lime"],
  ["expense.other", "otros", "expense", "circle", "gray"]
] as const;

export async function ensureSystemCategories() {
  await Promise.all(
    systemCategories.map(([translationKey, name, type, icon, color]) =>
      Category.updateOne(
        { translationKey, type, isSystem: true, userId: null },
        { $setOnInsert: { translationKey, name, type, icon, color, isSystem: true, isActive: true, userId: null } },
        { upsert: true }
      )
    )
  );
}

export const essentialAntExpenseCategoryKeys = new Set([
  "expense.rent",
  "expense.common_expenses",
  "expense.transport",
  "expense.stm",
  "expense.ute",
  "expense.ose",
  "expense.antel",
  "expense.mutualista",
  "expense.health",
  "expense.education",
  "expense.savings"
]);
