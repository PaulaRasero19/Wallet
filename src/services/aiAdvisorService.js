import { categories } from "../data/categories";
import { goals } from "../data/goals";
import { subscriptions } from "../data/subscriptions";
import { transactions } from "../data/transactions";
import { formatCurrency, getProgress } from "../utils/formatters";

const AI_API_URL = process.env.EXPO_PUBLIC_FINFLOW_AI_URL;

function getFinancialContext() {
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const budget = categories.reduce((total, category) => total + category.budget, 0);
  const budgetUsed = getProgress(expenses, budget);
  const highestCategory = [...categories].sort(
    (a, b) => getProgress(b.spent, b.budget) - getProgress(a.spent, a.budget)
  )[0];
  const subscriptionTotal = subscriptions.reduce((total, subscription) => total + subscription.amount, 0);
  const slowestGoal = [...goals].sort(
    (a, b) => getProgress(a.saved, a.target) - getProgress(b.saved, b.target)
  )[0];

  return {
    budget,
    budgetUsed,
    categories,
    expenses,
    goals,
    highestCategory,
    income,
    savingsCapacity: Math.max(income - expenses, 0),
    slowestGoal,
    subscriptionTotal,
    subscriptions,
    transactions
  };
}

function buildLocalAdvice(question) {
  const context = getFinancialContext();
  const highestProgress = getProgress(context.highestCategory.spent, context.highestCategory.budget);
  const riskLevel = context.budgetUsed > 85 ? "Alto" : context.budgetUsed > 70 ? "Medio" : "Bajo";
  const goalProgress = getProgress(context.slowestGoal.saved, context.slowestGoal.target);

  return {
    source: "Motor IA local",
    summary: `Usaste ${context.budgetUsed}% del presupuesto mensual. El foco principal esta en ${context.highestCategory.name}, que ya llego a ${highestProgress}% de su limite.`,
    riskLevel,
    answer: question
      ? `Para tu consulta: "${question}", FinFlow prioriza bajar gastos variables antes de tocar ahorro.`
      : "FinFlow detecto oportunidades de ahorro usando tus movimientos, presupuesto, suscripciones y objetivos.",
    recommendedActions: [
      `Revisar ${context.highestCategory.name} durante 7 dias y fijar un tope semanal.`,
      `Auditar suscripciones: suman ${formatCurrency(context.subscriptionTotal)} por mes.`,
      `Destinar ${formatCurrency(2500)} extra a "${context.slowestGoal.name}", que va en ${goalProgress}% de avance.`
    ],
    notificationSuggestion:
      riskLevel === "Alto"
        ? "Activar alerta de presupuesto casi alcanzado."
        : "Activar recordatorio semanal de revision de gastos."
  };
}

export async function generateAdvisorResult(question) {
  const context = getFinancialContext();

  if (!AI_API_URL) {
    return buildLocalAdvice(question);
  }

  try {
    const response = await fetch(`${AI_API_URL}/api/financial-advice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        context,
        question
      })
    });

    if (!response.ok) {
      throw new Error("AI backend unavailable");
    }

    return await response.json();
  } catch {
    return {
      ...buildLocalAdvice(question),
      source: "Motor IA local (fallback por conexion)"
    };
  }
}
