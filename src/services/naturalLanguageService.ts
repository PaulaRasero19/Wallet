import { BudgetCategory, MovementProposal } from "../types/finflow";

function amountFrom(text: string) {
  const installmentAmount = text.match(/cuotas?\s*(de)?\s*(\d+[\d.,]*)/i);
  if (installmentAmount?.[2]) {
    return Number(installmentAmount[2].replace(/\./g, "").replace(",", "."));
  }
  const match = text.match(/(\d+[\d.,]*)/);
  return match ? Number(match[1].replace(/\./g, "").replace(",", ".")) : 0;
}

function categoryFrom(text: string): BudgetCategory | "Salary" | "Freelance" | "Other" {
  if (/cobr|salario|sueldo|ingres/i.test(text)) return "Salary";
  if (/merienda|cafe|caf[eé]|pedido|comida|super/i.test(text)) return "Food";
  if (/stm|bondi|bus|uber|taxi/i.test(text)) return "Transport";
  if (/notebook|ropa|compra|shopping/i.test(text)) return "Shopping";
  if (/alquiler|gastos comunes/i.test(text)) return "Housing";
  return "Other";
}

function merchantFrom(text: string) {
  if (/antel/i.test(text)) return "Antel";
  if (/notebook/i.test(text)) return "Notebook";
  if (/merienda/i.test(text)) return "Merienda";
  if (/cobr|salario|sueldo/i.test(text)) return "Salary";
  const words = text.split(" ").filter(Boolean);
  return words.slice(-2).join(" ") || "Movimiento";
}

export function parseMovementProposal(text: string): MovementProposal | null {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const amount = amountFrom(cleanText);
  const isIncome = /cobr|salario|sueldo|ingres/i.test(cleanText);
  const isTask = /recordame|recordar|pagar/i.test(cleanText) && amount === 0;
  const installmentsMatch = cleanText.match(/(\d+)\s*cuotas?\s*(de)?\s*(\d+[\d.,]*)?/i);
  const installmentAmount = String(installmentsMatch?.[3] || amount);
  const category = categoryFrom(cleanText);
  const isAntExpense = !isIncome && amount > 0 && amount <= 700;

  if (isTask) {
    return {
      type: "task",
      merchant: merchantFrom(cleanText),
      amount: 0,
      currency: "UYU",
      category,
      date: /viernes/i.test(cleanText) ? "Friday" : "Today",
      accountId: "itau-uyu",
      isAntExpense: false,
      reminderText: cleanText
    };
  }

  return {
    type: isIncome ? "income" : "expense",
    merchant: merchantFrom(cleanText),
    amount: isIncome ? amount : -Math.abs(amount),
    currency: /d[oó]lares|usd/i.test(cleanText) ? "USD" : /euros|eur/i.test(cleanText) ? "EUR" : "UYU",
    category,
    date: /hoy/i.test(cleanText) ? "Today" : "Today",
    accountId: installmentsMatch ? "visa-uyu" : "itau-uyu",
    installments: installmentsMatch
      ? {
          current: 1,
          total: Number(installmentsMatch[1]),
          amountPerInstallment: Number(installmentAmount.replace(/\./g, "").replace(",", ".")),
          remainingAmount: Number(installmentsMatch[1]) * Number(installmentAmount.replace(/\./g, "").replace(",", ".")),
          nextDueDate: "2026-08-10"
        }
      : undefined,
    isAntExpense
  };
}
