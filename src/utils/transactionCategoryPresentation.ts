import { Category, Transaction } from "../types/finflow";

export type MovementCategoryKey = "home" | "transport" | "shopping" | "food" | "rent" | "entertainment" | "income" | "health" | "education" | "other";

const rules: Array<{ key: MovementCategoryKey; pattern: RegExp }> = [
  { key: "rent", pattern: /\b(alquiler|rent|inmobiliaria|arrendamiento)\b/ },
  { key: "home", pattern: /\b(hogar|housing|servicios?|internet|ute|ose|antel|gas|electricidad|agua|luz)\b/ },
  { key: "transport", pattern: /\b(transporte|transport|stm|traslado|uber|taxi|nafta|combustible|peaje|omnibus|bus|tren)\b/ },
  { key: "food", pattern: /\b(comida|food|restaurante|pedidosya|cafe|almuerzo|cena|delivery)\b/ },
  { key: "health", pattern: /\b(salud|farmacia|farmashop|medico|mutualista|hospital)\b/ },
  { key: "education", pattern: /\b(educacion|estudio|facultad|curso|materiales|libro|universidad|beca)\b/ },
  { key: "entertainment", pattern: /\b(entretenimiento|entertainment|ocio|salidas?|cine|streaming|evento|ticket)\b/ },
  { key: "shopping", pattern: /\b(compras?|supermercado|ropa|tienda|shopping|cuotas?)\b/ },
  { key: "income", pattern: /\b(ingreso|income|salary|salario|sueldo|empleador|freelance|venta|regalo|comision|premio)\b/ }
];

const labels: Record<MovementCategoryKey, string> = {
  education: "Educación",
  entertainment: "Entretenimiento",
  food: "Comida",
  health: "Salud",
  home: "Hogar y servicios",
  income: "Ingresos / salario",
  other: "Otros",
  rent: "Alquiler",
  shopping: "Compras",
  transport: "Transporte"
};

function normalized(value: unknown) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function resolveMovementCategory(transaction: Transaction, category?: Category) {
  const assignedCategory = normalized([
    category?.name,
    category?.translationKey,
    category?.translation_key,
    transaction.category
  ].filter(Boolean).join(" "));
  const context = normalized([
    transaction.merchant,
    transaction.title,
    transaction.note
  ].filter(Boolean).join(" "));

  if (transaction.type === "income") return { key: "income" as const, label: labels.income };
  const assignedMatch = rules.find((rule) => rule.pattern.test(assignedCategory));
  const categoryIsGeneric = /\b(other|otros?|sin categoria)\b/.test(assignedCategory);
  const match = !categoryIsGeneric && assignedMatch ? assignedMatch : rules.find((rule) => rule.pattern.test(context));
  const key = match?.key || "other";
  return { key, label: labels[key] };
}
