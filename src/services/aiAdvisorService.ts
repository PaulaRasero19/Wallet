import { Budget, Goal, Transaction } from "../types/finflow";
import { formatMoney, percentage } from "../utils/money";

const AI_API_URL = process.env.EXPO_PUBLIC_FINFLOW_AI_URL;

export type AdvisorResult = {
  source: string;
  summary: string;
  riskLevel: string;
  answer: string;
  recommendedActions: string[];
  notificationSuggestion: string;
};

type AdvisorContext = {
  budgets: Budget[];
  goals: Goal[];
  transactions: Transaction[];
};

function buildContext({ budgets, goals, transactions }: AdvisorContext) {
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const budgetLimit = budgets.reduce((sum, item) => sum + item.limit, 0);
  const budgetUsed = percentage(expenses, budgetLimit);
  const highestCategory = [...budgets].sort((a, b) => percentage(b.spent, b.limit) - percentage(a.spent, a.limit))[0];
  const slowestGoal = [...goals].sort((a, b) => percentage(a.saved, a.target) - percentage(b.saved, b.target))[0];

  return {
    budgetLimit,
    budgetUsed,
    expenses,
    highestCategory,
    income,
    savingsCapacity: Math.max(income - expenses, 0),
    slowestGoal
  };
}

function localAdvice(question: string, data: AdvisorContext): AdvisorResult {
  const context = buildContext(data);
  const categoryProgress = percentage(context.highestCategory.spent, context.highestCategory.limit);
  const goalProgress = percentage(context.slowestGoal.saved, context.slowestGoal.target);
  const riskLevel = context.budgetUsed > 86 ? "High" : context.budgetUsed > 68 ? "Medium" : "Low";

  return {
    source: "FinFlow local AI",
    summary: `You used ${context.budgetUsed}% of your monthly budget. ${context.highestCategory.name} is the category needing the most attention.`,
    riskLevel,
    answer: question
      ? `For "${question}", start with a small weekly cap before changing fixed expenses.`
      : "FinFlow reviewed your spending, budgets and goals to suggest a practical next step.",
    recommendedActions: [
      `Set a 7-day limit for ${context.highestCategory.name}, currently at ${categoryProgress}%.`,
      `Move ${formatMoney(120).replace("+", "")} into ${context.slowestGoal.name}; it is now ${goalProgress}% complete.`,
      "Turn on a weekly budget review reminder every Sunday."
    ],
    notificationSuggestion:
      riskLevel === "High"
        ? "Enable a budget warning when a category reaches 85%."
        : "Enable a gentle Friday spending summary."
  };
}

export async function generateAdvisorResult(question: string, data: AdvisorContext): Promise<AdvisorResult> {
  if (!AI_API_URL) return localAdvice(question, data);

  try {
    const response = await fetch(`${AI_API_URL}/api/financial-advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: data, question })
    });

    if (!response.ok) throw new Error("AI backend unavailable");
    return response.json();
  } catch {
    return {
      ...localAdvice(question, data),
      source: "FinFlow local AI fallback"
    };
  }
}
